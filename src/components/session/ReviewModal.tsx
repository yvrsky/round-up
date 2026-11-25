import { useState } from "react";
import { Text } from "react-native";

import { StarRatingInput } from "@/components/profile/ControlRatingStars";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { useSubmitReview } from "@/hooks/useReviews";
import { errorMessage } from "@/lib/format";

type ReviewModalProps = {
  visible: boolean;
  onClose: () => void;
  sessionId: string;
  revieweeId: string;
  revieweeName: string;
};

/** Post-session peer review: control and punctuality feed the partner's Control Rating. */
export function ReviewModal({ visible, onClose, sessionId, revieweeId, revieweeName }: ReviewModalProps) {
  const [controlScore, setControlScore] = useState(0);
  const [punctualityScore, setPunctualityScore] = useState(0);
  const [comment, setComment] = useState("");
  const submit = useSubmitReview(sessionId);
  const canSubmit = controlScore > 0 && punctualityScore > 0;

  return (
    <Sheet
      visible={visible}
      title={`Review ${revieweeName}`}
      onClose={onClose}
      footer={
        <Button
          title="Submit review"
          disabled={!canSubmit}
          loading={submit.isPending}
          onPress={() =>
            submit.mutate(
              { revieweeId, controlScore, punctualityScore, comment: comment.trim() || null },
              { onSuccess: onClose }
            )
          }
        />
      }
    >
      <Text className="text-base text-slate-600">
        Rate how safe and reliable {revieweeName} was as a training partner, not who won. Your scores update their
        Control Rating.
      </Text>
      <StarRatingInput
        label="Control"
        description="Managed power, respected the agreed intensity, tapped/released safely."
        value={controlScore}
        onChange={setControlScore}
      />
      <StarRatingInput
        label="Punctuality & respect"
        description="Showed up on time, prepared, and was respectful."
        value={punctualityScore}
        onChange={setPunctualityScore}
      />
      <Input
        label="Comment (optional)"
        value={comment}
        onChangeText={setComment}
        maxLength={300}
        multiline
        placeholder="Anything other athletes should know?"
        className="h-24 py-3"
        textAlignVertical="top"
      />
      {submit.isError ? <Text className="text-sm text-red-600">{errorMessage(submit.error)}</Text> : null}
    </Sheet>
  );
}
