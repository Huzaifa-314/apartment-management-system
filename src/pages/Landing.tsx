import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useHomepageData } from '../hooks/useHomepageData';
import PublicFooter from '../components/shared/PublicFooter';
import HeroSection from '../components/landing/HeroSection';
import LiveStatsStrip from '../components/landing/LiveStatsStrip';
import FeaturedRoomsSection from '../components/landing/FeaturedRoomsSection';
import AnnouncementsSection from '../components/landing/AnnouncementsSection';
import PricingSnapshotSection from '../components/landing/PricingSnapshotSection';
import AmenitiesStrip from '../components/landing/AmenitiesStrip';
import CtaSection from '../components/landing/CtaSection';

const Landing: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const { homepage, announcements, loading, homepageUnavailable } = useHomepageData();

  const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard';
  const primaryCtaHref = user ? dashboardHref : '/register';
  const primaryCtaLabel = user ? 'Go to dashboard' : 'Get Started';

  const stats = homepage?.stats ?? null;
  const pricing = homepage?.pricing ?? {};
  const topAmenities = homepage?.topAmenities ?? [];
  const featuredRooms = homepage?.featuredRooms ?? [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroSection
        heroTagline={settings.heroTagline}
        propertyName={settings.propertyName}
        user={user}
        primaryCtaHref={primaryCtaHref}
        primaryCtaLabel={primaryCtaLabel}
        stats={stats}
        loading={loading}
        homepageUnavailable={homepageUnavailable}
      />

      <LiveStatsStrip
        stats={stats}
        loading={loading}
        homepageUnavailable={homepageUnavailable}
      />

      <FeaturedRoomsSection
        rooms={featuredRooms}
        loading={loading}
        homepageUnavailable={homepageUnavailable}
      />

      <AnnouncementsSection announcements={announcements} />

      <PricingSnapshotSection
        pricing={pricing}
        loading={loading}
        homepageUnavailable={homepageUnavailable}
      />

      <AmenitiesStrip
        topAmenities={topAmenities}
        loading={loading}
        homepageUnavailable={homepageUnavailable}
      />

      <CtaSection ctaSubtext={settings.ctaSubtext} />

      <PublicFooter />
    </div>
  );
};

export default Landing;
