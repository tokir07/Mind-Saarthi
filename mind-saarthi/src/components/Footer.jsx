import React from 'react';
import { Brain, Heart, ShieldCheck } from 'lucide-react';
import { FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-slate-50 dark:bg-[#0B1121] border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 text-slate-600 dark:text-slate-400">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

                    <div className="md:col-span-1 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-md">
                                <Brain size={18} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                MindSaarthi <span className="text-primary dark:text-primary-light">AI</span>
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs">
                            Minding mental wellness with the empathetic power of Artificial Intelligence. Screening emotions, preserving privacy.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:text-primary dark:hover:text-primary-light transition-colors">
                                <FaTwitter size={18} />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:text-primary dark:hover:text-primary-light transition-colors">
                                <FaLinkedin size={18} />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:text-primary dark:hover:text-primary-light transition-colors">
                                <FaGithub size={18} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Platform</h4>
                        <ul className="space-y-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">How it Works</a></li>
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Risk Assessment</a></li>
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Clinical Dashboard</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Resources</h4>
                        <ul className="space-y-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Healthcare Providers</a></li>
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Emergency Contacts</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Legal</h4>
                        <ul className="space-y-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors">Cookie Policy</a></li>
                            <li><a href="#" className="hover:text-primary dark:hover:text-primary-light transition-colors flex items-center gap-2">HIPAA Compliance <ShieldCheck size={14} className="text-emerald-500" /></a></li>
                        </ul>
                    </div>

                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 dark:border-slate-800 text-sm font-medium">
                    <p>© {new Date().getFullYear()} MindSaarthi AI. All rights reserved.</p>
                    <p className="flex items-center gap-1 mt-4 md:mt-0">
                        Made with <Heart size={14} className="text-accent fill-current" /> by the Design flow
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
