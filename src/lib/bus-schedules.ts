import { getBusTimings } from "@/lib/store";
import type { BusTiming } from "@/lib/types";

export async function getActiveBusSchedules(): Promise<BusTiming[]> {
  const data = await getBusTimings();
  return data.filter((bus) => bus.isActive);
}
