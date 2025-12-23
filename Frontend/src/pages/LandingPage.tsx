import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

interface Stats {
  activeProviders: number;
  jobsCompleted: number;
  averageRating: number;
  satisfactionRate: number;
}

export const LandingPage = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({
    activeProviders: 40, // default fallback
    jobsCompleted: 15000,
    averageRating: 4.8,
    satisfactionRate: 98
  });

  useEffect(() => {
    const fetchStats = async (lat?: number, lng?: number) => {
      try {
        let url = 'http://localhost:8080/api/stats';
        if (lat && lng) {
          url += `?lat=${lat}&lng=${lng}`;
        }
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    // Fetch stats without location initially to avoid browser violation
    fetchStats();

    // We can add a "Locate Me" button later if needed
  }, []);

  const handleBookNow = () => {
    navigate('/login')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-slate-50 font-sans text-slate-600 antialiased overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-700">
      {/* Sticky Navbar with Dashboard Gradient */}
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] shadow-lg shadow-indigo-200/20">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="size-9 text-white bg-white/20 rounded-xl p-1.5 backdrop-blur-sm border border-white/20 shadow-inner">
              <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight">QuickFix</h2>
          </div>

          <div className="hidden md:flex flex-1 justify-end items-center gap-8">
            <nav className="flex items-center gap-6">
              <a className="text-indigo-50 hover:text-white transition-colors text-sm font-medium" href="#">Services</a>
              <a className="text-indigo-50 hover:text-white transition-colors text-sm font-medium" href="#how-it-works">How it works</a>
              <a className="text-indigo-50 hover:text-white transition-colors text-sm font-medium" href="#reviews">Reviews</a>
            </nav>
            <div className="flex gap-3">
              <button
                onClick={handleLogin}
                className="px-5 h-10 rounded-full text-white font-medium text-sm hover:bg-white/10 transition-all border border-transparent hover:border-white/20">
                Log In
              </button>
              <button
                onClick={handleBookNow}
                className="px-6 h-10 rounded-full bg-white text-[#7C3AED] font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/10 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                Book Now
              </button>
            </div>
          </div>
          <div className="md:hidden text-white cursor-pointer hover:bg-white/10 p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined block">menu</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full">
        {/* Hero Section */}
        <section className="w-full relative overflow-hidden bg-white pb-16 pt-12 md:pb-32 md:pt-20 lg:pb-40 lg:pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-50 pointer-events-none"></div>

          <div className="relative z-10 mx-auto max-w-[1200px] px-4 md:px-8">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
              <div className="flex-1 flex flex-col gap-6 lg:gap-8 text-center lg:text-left max-w-2xl lg:max-w-none">
                <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-1.5 shadow-sm mx-auto lg:mx-0 backdrop-blur-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-indigo-900 tracking-wide uppercase">Live: {stats.activeProviders} Pros available now</span>
                </div>

                <h1 className="text-slate-900 text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                  Expert Help <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#6366F1]" style={{ fontSize: '3rem' }}>in 30 Mins.</span>
                </h1>

                <p className="text-slate-500 text-lg md:text-xl leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                  Plumbing, Electrical, Cleaning. Guaranteed arrival time or the service is free. Experience the new standard in home services.
                </p>

                <div className="w-full max-w-lg mx-auto lg:mx-0">
                  {/* <label className="relative flex items-center group">
                    <div className="absolute left-4 text-indigo-500 transition-colors group-focus-within:text-indigo-600">
                      <span className="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <input
                      className="w-full h-14 md:h-16 pl-12 pr-36 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-indigo-100/40 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all text-base md:text-lg"
                      placeholder="Enter your zip code"
                    />
                    <button className="absolute right-2 h-10 md:h-12 px-6 md:px-8 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white font-bold text-sm md:text-base shadow-md hover:shadow-lg hover:brightness-110 transition-all active:scale-95">
                      Find Help
                    </button>
                  </label> */}
                  <div className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-sm font-medium text-slate-400">
                    <span className="material-symbols-outlined text-indigo-500 text-lg">verified_user</span>
                    <span>Fully Licensed & Insured Professionals</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full max-w-[600px] lg:max-w-none perspective-1000">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] rounded-[2.5rem] rotate-3 opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500"></div>
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/20 aspect-[4/3] bg-slate-900 border-4 border-white transform transition-transform duration-500 hover:scale-[1.01]">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-110"
                      style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCoFkPBXqUA7tPsIF2GqAGrRuyZevVww--vCKlRoF6F6ZTvJZTU6jp-dJ-a5DKllt_jOYsPnYab3u_jnIk2S2f2p_kdOztVB53B6LybCzkVAhl3tL8dLPsIkcMw2pO_wPFzWCc0TyH_gRdEKGO82fOrc6cgmR1OpzAiYK2pnP9Ut7eO8Pkxlh9y_3l5l4YeuQHgqQfd-dHxpNXqTnHqRSO_o_xyS1jPuFyVv1Ee9sb4kIOaM9zI5OExAYoiQTqgz9Qlxmor_lUfiL4")' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50">
                      <div className="relative">
                        <div className="size-12 rounded-full bg-indigo-100 flex items-center justify-center text-[#7C3AED]">
                          <span className="material-symbols-outlined">bolt</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 size-5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold text-sm">Mike is arriving</p>
                        <p className="text-indigo-600 font-medium text-xs">4 mins away • Electrical Expert</p>
                      </div>
                      <div className="ml-auto flex flex-col items-end">
                        <div className="flex text-yellow-500 text-xs">★★★★★</div>
                        <span className="text-slate-400 text-[10px] font-medium">5.0 (124 jobs)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-16 lg:mt-24">
              {[
                { icon: 'check_circle', label: 'Jobs Completed', value: stats.jobsCompleted.toLocaleString() + '+' },
                { icon: 'timer', label: 'Avg Arrival', value: '22 min' },
                { icon: 'sentiment_satisfied', label: 'Satisfaction', value: stats.satisfactionRate + '%' },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all hover:-translate-y-1">
                  <div className="mb-3 p-3 rounded-2xl bg-indigo-50 text-[#7C3AED]">
                    <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                  </div>
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</span>
                  <span className="text-sm font-medium text-slate-500 mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instant Services */}
        <section className="w-full py-20 bg-slate-50 relative">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-[#7C3AED] font-bold tracking-wider uppercase text-sm" style={{ fontSize: '3rem' }}>Services</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2" style={{ fontSize: '2rem' }}>Whatever breaks, we fix.</h2>
              </div>
              {/* <a href="#" className="flex items-center gap-2 text-[#7C3AED] font-bold hover:text-[#6366F1] transition-colors group">
                View all services
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </a> */}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { icon: 'water_drop', name: 'Plumbing' },
                { icon: 'bolt', name: 'Electrical' },
                { icon: 'cleaning_services', name: 'Cleaning' },
                { icon: 'build', name: 'Assembly' },
                { icon: 'lock', name: 'Locksmith' },
                { icon: 'home_repair_service', name: 'Handyman' },
              ].map((service, i) => (
                <button key={i} className="flex flex-col items-center justify-center gap-4 p-6 rounded-3xl bg-white border border-slate-150 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all hover:-translate-y-1 group">
                  <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors duration-300">
                    <span className="material-symbols-outlined text-3xl">{service.icon}</span>
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900">{service.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="w-full py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How QuickFix Works</h2>
              <p className="text-slate-500 text-lg">Three simple steps to get your home back to normal. No stress, no waiting.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-200 via-indigo-200 to-slate-200"></div>

              {[
                { step: 1, title: 'Request', desc: 'Choose your service and tell us what\'s wrong. Get an instant quote.' },
                { step: 2, title: 'Match', desc: 'Our algorithm finds the nearest top-rated pro in seconds.' },
                { step: 3, title: 'Relax', desc: 'Your pro arrives within 30 minutes. Pay only after you\'re satisfied.' }
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center text-center gap-4 group">
                  <div className="relative z-10 size-24 rounded-3xl bg-white border-4 border-slate-50 shadow-xl shadow-indigo-100/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl font-black text-[#7C3AED]">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed max-w-[280px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action / Map Teaser */}
        <section className="w-full py-16 px-4 md:px-8">
          <div className="max-w-[1200px] mx-auto relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/20 group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: 'url(/city-blur.png)' }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/95 to-[#6366F1]/90"></div>

            <div className="relative px-8 py-12 md:px-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-center md:text-left">
                <span className="inline-block py-1 px-3 rounded-lg bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">Live in your neighborhood</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{stats.activeProviders} Pros in your area</h2>
                <p className="text-indigo-100 text-lg max-w-xl">
                  We've expanded our network. Average response time in your neighborhood is currently <span className="font-bold text-white underline decoration-white/30 decoration-2 underline-offset-4">14 minutes</span>.
                </p>
              </div>
              {/* <button className="shrink-0 h-14 px-8 rounded-full bg-white text-[#7C3AED] font-bold text-lg hover:bg-slate-50 transition-colors shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                View Live Map
              </button> */}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="reviews" className="w-full py-20 bg-slate-50">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">What neighbors are saying</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'James D.', loc: 'Brooklyn, NY', txt: 'My sink burst at 10 PM. QuickHelper had a plumber at my door in 18 minutes. Lifesaver.' },
                { name: 'Sarah L.', loc: 'Austin, TX', txt: 'The tracking feature is amazing. I knew exactly when the electrician would arrive. No more 4-hour windows.' },
                { name: 'Emily R.', loc: 'San Francisco, CA', txt: 'The pro was polite, on-time and left everything spotless. Easily the best home service experience I\'ve had.' },
                { name: 'Marcus T.', loc: 'Seattle, WA', txt: 'Booked a quick clean before my in-laws arrived. The team was efficient and thorough. Highly recommend.' }
              ].map((t, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 hover:border-indigo-200 transition-colors">
                  <div className="flex text-yellow-400 text-sm gap-0.5">
                    {'★★★★★'}
                  </div>
                  <p className="text-slate-600 italic font-medium leading-relaxed">"{t.txt}"</p>
                  <div className="mt-auto flex items-center gap-3 pt-4 border-t border-slate-50">
                    <div className="size-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-[#7C3AED] flex items-center justify-center font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.loc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-white">
                <div className="size-10 bg-[#7C3AED] rounded-xl flex items-center justify-center text-xl font-bold">Q</div>
                <span className="text-xl font-bold">QuickFix</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                The fastest way to get household problems fixed. 30 minutes or it's free. Guaranteed.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Services</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Plumbing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Electrical</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cleaning</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Support</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
            <p>&copy; {new Date().getFullYear()} QuickFix Inc. All rights reserved.</p>
            <p>Made for modern living.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
