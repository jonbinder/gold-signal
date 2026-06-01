export function ChartCaption({ children }: { children: React.ReactNode }) {
  return <p className="gs-chart-caption">{children}</p>;
}

export function ChartEmpty({ message }: { message: string }) {
  return <p className="gs-chart-empty">{message}</p>;
}
