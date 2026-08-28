import Desk from "./desk";
import packet from "@/fixtures/case.json";
import type { Packet } from "@/lib/domain/case";

export default function Page() {
  return <Desk packet={packet as Packet} />;
}
