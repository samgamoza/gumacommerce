import { CartProvider } from "@/components/v0-store/cart-provider";
import { StoreHeader } from "@/components/v0-store/store-header";
import { Hero } from "@/components/v0-store/hero";
import { FeaturedProducts } from "@/components/v0-store/featured-products";
import { TodaysDeals } from "@/components/v0-store/todays-deals";
import { NewArrivals } from "@/components/v0-store/new-arrivals";
import { LiveSelling } from "@/components/v0-store/live-selling";
import { PopularProducts } from "@/components/v0-store/popular-products";
import { CustomerReviews } from "@/components/v0-store/customer-reviews";
import { SiteFooter } from "@/components/v0-store/site-footer";
import { MessengerWidget } from "@/components/v0-store/messenger-widget";
import { CheckoutDrawer } from "@/components/v0-store/checkout-drawer";

export default function ModelStorePage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <main>
          <Hero />
          <FeaturedProducts />
          <TodaysDeals />
          <NewArrivals />
          <LiveSelling />
          <PopularProducts />
          <CustomerReviews />
        </main>
        <SiteFooter />
        <MessengerWidget />
        <CheckoutDrawer />
      </div>
    </CartProvider>
  );
}
