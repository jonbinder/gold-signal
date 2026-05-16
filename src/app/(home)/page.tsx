import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeTicker } from "@/components/home/HomeTicker";

export default function HomePage() {
  return (
    <>
      <HomeTicker />
      <HomeHeader />
      <HomeHero />
    </>
  );
}
