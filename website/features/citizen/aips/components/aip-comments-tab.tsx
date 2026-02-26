import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import type { CommentPlaceholder } from '@/features/citizen/aips/types';

export default function AipCommentsTab({ comments }: { comments: CommentPlaceholder[] }) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-3xl text-slate-900">Comments</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-lg text-slate-600">Citizen feedback and discussion for this AIP will appear here.</p>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <Textarea placeholder="Write a comment..." className="min-h-[100px] bg-white" />
          <div className="flex justify-end">
            <Button disabled>Post Comment</Button>
          </div>
        </div>

        <div className="space-y-4">
          {comments.map((comment, index) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {comment.name} - {comment.barangay}
                </p>
                <p className="text-xs text-slate-500">{comment.timestamp}</p>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{comment.content}</p>
              {index < comments.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

