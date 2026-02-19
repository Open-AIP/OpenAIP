import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ReviewActionsCardProps = {
  canReview: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  noteError: string | null;
  submitError: string | null;
  submitting: boolean;
  onPublishClick: () => void;
  onRequestRevisionClick: () => void;
};

export function ReviewActionsCard(props: ReviewActionsCardProps) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-5 space-y-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Review Actions</div>
          <div className="text-xs text-slate-500">Make a decision on this AIP</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-700">
            Revision Comments <span className="text-rose-600">*</span>
          </div>
          <Textarea
            value={props.note}
            onChange={(event) => props.onNoteChange(event.target.value)}
            placeholder="Write revision comments or feedback..."
            className="min-h-[90px]"
          />
          {props.noteError ? <div className="text-xs text-rose-600">{props.noteError}</div> : null}
        </div>

        {props.submitError ? <div className="text-xs text-rose-600">{props.submitError}</div> : null}

        <Button
          className="w-full bg-teal-600 hover:bg-teal-700"
          onClick={props.onPublishClick}
          disabled={!props.canReview || props.submitting}
        >
          Publish AIP
        </Button>
        <Button
          variant="outline"
          className="w-full border-orange-400 text-orange-600 hover:bg-orange-50"
          onClick={props.onRequestRevisionClick}
          disabled={!props.canReview || props.submitting}
        >
          Request Revision
        </Button>
      </CardContent>
    </Card>
  );
}
