import React, { useState } from 'react';
import { PGProvider, usePG } from './context/PGContext';
import { Navbar } from './components/Navbar';
import { DesktopSidebar } from './components/DesktopSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { RoomsView } from './components/RoomsView';
import { ResidentsView } from './components/ResidentsView';
import { ApplicationsView } from './components/ApplicationsView';
import { PaymentsView } from './components/PaymentsView';
import { RulesView } from './components/RulesView';
import { SettingsView } from './components/SettingsView';
import { TenantOnboardingView } from './components/TenantOnboardingView';
import { InviteTenantModal } from './components/InviteTenantModal';

const AppContent: React.FC = () => {
  const { activeView, setActiveView, isPublicPortalMode, setPublicPortalMode } = usePG();

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [paymentResidentId, setPaymentResidentId] = useState<string | null>(null);

  // If in public tenant portal mode (e.g. tenant clicked an onboarding link or toggle)
  if (isPublicPortalMode) {
    return (
      <TenantOnboardingView
        onBackToAdmin={() => setPublicPortalMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenInviteModal={() => setShowInviteModal(true)} />

      {/* Main App Layout with responsive Desktop Sidebar and Mobile Bottom Navigation */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6">
        {/* Desktop Sidebar */}
        <DesktopSidebar onOpenInviteModal={() => setShowInviteModal(true)} />

        {/* Dynamic Main View Area */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6">
          {activeView === 'dashboard' && (
            <DashboardView
              onOpenInviteModal={() => setShowInviteModal(true)}
              onOpenPaymentModal={() => {
                setPaymentResidentId(null);
                setActiveView('payments');
              }}
            />
          )}

          {activeView === 'rooms' && <RoomsView />}

          {activeView === 'residents' && (
            <ResidentsView
              onOpenInviteModal={() => setShowInviteModal(true)}
              onOpenPaymentModalForResident={(residentId) => {
                setPaymentResidentId(residentId);
                setActiveView('payments');
              }}
            />
          )}

          {activeView === 'applications' && <ApplicationsView />}

          {activeView === 'payments' && (
            <PaymentsView
              initialResidentIdForPayment={paymentResidentId}
              onClearInitialResidentId={() => setPaymentResidentId(null)}
            />
          )}

          {activeView === 'rules' && <RulesView />}

          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <MobileBottomNav onOpenInviteModal={() => setShowInviteModal(true)} />

      {/* Global Tenant Onboarding Link Generator Modal */}
      <InviteTenantModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onOpenPortalDirectly={() => {
          setShowInviteModal(false);
          setPublicPortalMode(true);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <PGProvider>
      <AppContent />
    </PGProvider>
  );
}
