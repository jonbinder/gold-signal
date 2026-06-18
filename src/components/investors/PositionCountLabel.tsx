import { INVESTOR_NEEDS_DATA } from "@/lib/investors/csv-data";

type Props = {
  count: number;
  singular?: string;
  plural?: string;
};

export function PositionCountLabel({
  count,
  singular = "tracked position",
  plural = "tracked positions",
}: Props) {
  if (count > 0) {
    return (
      <>
        {count} {count === 1 ? singular : plural}
      </>
    );
  }

  return <span className="investor-needs-data">{INVESTOR_NEEDS_DATA}</span>;
}
