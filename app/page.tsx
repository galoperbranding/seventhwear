import HeroSlider from '@/components/home/HeroSlider';
import Marquee from '@/components/home/Marquee';
import Collections from '@/components/home/Collections';
import ShopTheLook from '@/components/home/ShopTheLook';
import Bestsellers from '@/components/home/Bestsellers';
import Categories from '@/components/home/Categories';
import Essentials from '@/components/home/Essentials';
import Newsletter from '@/components/home/Newsletter';
import CookieBanner from '@/components/home/CookieBanner';

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <div className="main-content">
        <Marquee />
        <Collections />
        <ShopTheLook />
        <Bestsellers />
        <Categories />
        <Essentials />
        <Newsletter />
      </div>
      <CookieBanner />
    </>
  );
}
