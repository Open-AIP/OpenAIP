import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ReviewConfirmDialogsProps = {
  aipTitle: string;
  barangayName?: string | null;
  note: string;
  submitting: boolean;
  publishOpen: boolean;
  revisionOpen: boolean;
  onPublishOpenChange: (open: boolean) => void;
  onRevisionOpenChange: (open: boolean) => void;
  onConfirmPublish: () => void;
  onConfirmRevision: () => void;
};

export function ReviewConfirmDialogs(props: ReviewConfirmDialogsProps) {
  return (
    <>
      <Dialog open={props.publishOpen} onOpenChange={props.onPublishOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish AIP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              Are you sure you want to publish this Annual Investment Plan? Once
              published, it will be publicly available.
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{props.aipTitle}</div>
              <div className="text-xs text-slate-500">{props.barangayName ?? "Barangay"}</div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => props.onPublishOpenChange(false)}
                disabled={props.submitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={props.onConfirmPublish}
                disabled={props.submitting}
              >
                Confirm &amp; Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={props.revisionOpen} onOpenChange={props.onRevisionOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              Are you sure you want to send this AIP back for revision? The
              barangay will be notified with your comments.
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500 mb-1">Your comment:</div>
              <div className="text-sm text-slate-900 whitespace-pre-wrap">
                {props.note.trim()}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => props.onRevisionOpenChange(false)}
                disabled={props.submitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={props.onConfirmRevision}
                disabled={props.submitting}
              >
                Confirm &amp; Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
