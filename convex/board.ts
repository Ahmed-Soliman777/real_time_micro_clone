import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const images = ["/logo.svg"];

export const create = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const authorName = identity.name ?? identity.nickname ?? "Anonymous";

    const randomImage = images[Math.floor(Math.random() * images.length)];

    const boardId = await ctx.db.insert("boards", {
      title: args.title,
      orgId: args.orgId,
      authorId: identity.subject,
      authorName: authorName,
      imageUrl: randomImage,
    });

    return boardId;
  },
});

export const remove = mutation({
  args: {
    id: v.id("boards"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.get(args.id);

    if (!board) {
      throw new Error("Board not found");
    }

    // Delete all favorites associated with this board
    const favorites = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_board", (q) =>
        q.eq("userId", identity.subject).eq("boardId", args.id),
      )
      .collect();

    for (const favorite of favorites) {
      await ctx.db.delete(favorite._id);
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

export const update = mutation({
  args: {
    id: v.id("boards"),
    title: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const title = args.title.trim();

    if (!title) {
      throw new Error("Title is required");
    }

    if (title.length > 60) {
      throw new Error("Title cannot exceed 60 characters");
    }

    const board = await ctx.db.get(args.id);

    if (!board) {
      throw new Error("Board not found");
    }

    await ctx.db.patch(args.id, {
      title,
    });

    return {
      ...board,
      title,
    };
  },
});

export const favorite = mutation({
  args: {
    id: v.id("boards"),
    orgId: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.get(args.id);

    if (!board) {
      throw new Error("Board not found");
    }

    const userId = identity.subject;

    const existingFavorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_board_org", (q) =>
        q.eq("userId", userId).eq("boardId", board._id).eq("orgId", args.orgId),
      )
      .unique();

    if (existingFavorite) {
      throw new Error("Favorite already exists");
    }

    await ctx.db.insert("userFavorites", {
      userId,
      boardId: board._id,
      orgId: args.orgId,
    });

    return board;
  },
});

export const unfavorite = mutation({
  args: {
    id: v.id("boards"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.get(args.id);

    if (!board) {
      throw new Error("Board not found");
    }

    const existingFavorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_board", (q) =>
        q.eq("userId", identity.subject).eq("boardId", board._id),
      )
      .unique();

    if (!existingFavorite) {
      throw new Error("Favorited board not found");
    }

    await ctx.db.delete(existingFavorite._id);

    return board;
  },
});

export const get = query({
  args: {
    id: v.id("boards"),
  },

  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.id);

    return board;
  },
});
