import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import CoreFeatures from '../components/CoreFeatures';
import DemoSection from '../components/DemoSection';
import DashboardPreview from '../components/DashboardPreview';
import Testimonials from '../components/Testimonials';
import Impact from '../components/Impact';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';
import ChatBotWidget from '../components/ChatBotWidget';

const LandingPage = ({ darkMode, toggleTheme }) => {
    return (
        <div className="overflow-x-hidden">
            <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
            <main>
                <HeroSection />
                <HowItWorks />
                <CoreFeatures />
                <DemoSection />
                <DashboardPreview />
                <Testimonials />
                <Impact />
                <CTASection />
            </main>
            <Footer />
            <ChatBotWidget />
        </div>
    );
};

export default LandingPage;
