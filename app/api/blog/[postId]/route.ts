import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/validation/parse";
import { blogPostInputSchema } from "@/schemas/blog.schema";
import { removePost, requireBlogAuthor, updatePost } from "@/services/blog.service";

type Context = { params: Promise<{ postId: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    await requireBlogAuthor();
    const { postId } = await context.params;
    const input = await parseJsonBody(request, blogPostInputSchema);
    return jsonSuccess(await updatePost(postId, input));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    await requireBlogAuthor();
    const { postId } = await context.params;
    await removePost(postId);
    return jsonSuccess({ deleted: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
