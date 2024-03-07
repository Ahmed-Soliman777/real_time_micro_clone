import {mutation} from "./_generated/server"
import {v} from "convex/values"

const images = [
    "/logo.svg"
]

export const create = mutation({
    args:{
        orgId:v.string(),
        title:v.string(),
    },
    handler: async (ctx, args) => {
        const indentity = await ctx.auth.getUserIdentity()

        if (!indentity) {
            throw new Error("Unauthorized")
        }

        const randomImage = images[Math.floor(Math.random() * images.length)]
        console.log(randomImage, "TEST");
        

        const board = await ctx.db.insert("boards",{
            title: args.title,
            orgId: args.orgId,
            authorId:indentity.subject,
            authorName:indentity.name!,
            imageUrl: randomImage
        })
        return board
    }
})