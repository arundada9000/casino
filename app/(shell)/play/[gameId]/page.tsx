import { notFound } from "next/navigation";
import { isGameId, isGameIdImplemented } from "@/core/game-engine";
import { CoinFlipScreen } from "@/games/coin-flip/CoinFlipScreen";
import { RouletteScreen } from "@/games/roulette/RouletteScreen";
import { BlackjackScreen } from "@/games/blackjack/BlackjackScreen";
import { SlotsScreen } from "@/games/slots/SlotsScreen";
import { DiceScreen } from "@/games/dice/DiceScreen";
import { CrashScreen } from "@/games/crash/CrashScreen";
import { MinesScreen } from "@/games/mines/MinesScreen";
import { PlinkoScreen } from "@/games/plinko/PlinkoScreen";
import { WheelScreen } from "@/games/wheel/WheelScreen";
import { HiLoScreen } from "@/games/hi-lo/HiLoScreen";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  if (!isGameId(gameId) || !isGameIdImplemented(gameId)) {
    notFound();
  }
  switch (gameId) {
    case "coin-flip":
      return <CoinFlipScreen />;
    case "roulette":
      return <RouletteScreen />;
    case "blackjack":
      return <BlackjackScreen />;
    case "slots":
      return <SlotsScreen />;
    case "dice":
      return <DiceScreen />;
    case "crash":
      return <CrashScreen />;
    case "mines":
      return <MinesScreen />;
    case "plinko":
      return <PlinkoScreen />;
    case "wheel":
      return <WheelScreen />;
    case "hi-lo":
      return <HiLoScreen />;
    default:
      notFound();
  }
}