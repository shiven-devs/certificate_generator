import { assertSameOrigin } from "@/lib/http/origin";
import { jsonSuccess, toErrorResponse } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/validation/parse";
import { blogPostInputSchema } from "@/schemas/blog.schema";
import { createPost, requireBlogAuthor } from "@/services/blog.service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const author = await requireBlogAuthor();
    const input = await parseJsonBody(request, blogPostInputSchema);
    return jsonSuccess(await createPost(author, input), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
