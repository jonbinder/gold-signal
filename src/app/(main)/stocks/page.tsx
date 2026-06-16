import { permanentRedirect } from "next/navigation";

/** MVP: index removed from nav; detail routes at /stocks/[ticker] stay live. */
export default function StocksIndexPage() {
  permanentRedirect("/investors");
}
