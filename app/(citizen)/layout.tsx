import type { ReactNode } from 'react';
import CitizenFooter from '@/features/citizen/components/CitizenFooter';
import FloatingChatButton from '@/features/citizen/components/FloatingChatButton';
import CitizenTopNav from '@/features/citizen/components/CitizenTopNav';

const CitizenLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#D3DBE0] to-[#FFFFFF]">
      <CitizenTopNav />
      <main className="mx-auto w-full max-w-full px-10 py-6 md:px-10 md:py-8">{children}</main>
      <CitizenFooter />
      <FloatingChatButton />
    </div>
  );
};

export default CitizenLayout;
