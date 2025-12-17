import { useNavigate } from 'react-router-dom'

export const LandingPage = () => {
  const navigate = useNavigate()

  const handleBookNow = () => {
    navigate('/login')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-surface font-display text-text-muted antialiased overflow-x-hidden">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-4 py-3 md:px-10">
          <div className="flex items-center gap-4 text-text-dark">
            <div className="size-8 text-primary">
              <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_6_319)">
                  <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor"></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_319"><rect fill="white" height="48" width="48"></rect></clipPath>
                </defs>
              </svg>
            </div>
            <h2 className="text-text-dark text-xl font-bold leading-tight tracking-[-0.015em]">QuickFix</h2>
          </div>
          <div className="hidden md:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-6">
              <a className="text-text-muted hover:text-primary transition-colors text-sm font-medium" href="#">Services</a>
              <a className="text-text-muted hover:text-primary transition-colors text-sm font-medium" href="#how-it-works">How it works</a>
              <a className="text-text-muted hover:text-primary transition-colors text-sm font-medium" href="#">Reviews</a>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleBookNow}
                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors shadow-sm">
                <span className="truncate">Book Now</span>
              </button>
              <button 
                onClick={handleLogin}
                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-surface text-text-dark border border-slate-200 text-sm font-bold hover:bg-slate-200 transition-colors">
                <span className="truncate">Log In</span>
              </button>
            </div>
          </div>
          <div className="md:hidden text-text-dark">
            <span className="material-symbols-outlined">menu</span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex justify-center py-5 px-4 md:px-0">
        <div className="flex flex-col max-w-[960px] flex-1 w-full gap-8">
          <div className="@container">
            <div className="flex flex-col gap-6 py-10 @[480px]:gap-8 @[864px]:flex-row-reverse">
              <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-3xl @[480px]:h-auto @[480px]:min-w-[400px] @[864px]:w-1/2 relative overflow-hidden group shadow-lg" data-alt="Professional handyman fixing a wooden shelf with tools" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCoFkPBXqUA7tPsIF2GqAGrRuyZevVww--vCKlRoF6F6ZTvJZTU6jp-dJ-a5DKllt_jOYsPnYab3u_jnIk2S2f2p_kdOztVB53B6LybCzkVAhl3tL8dLPsIkcMw2pO_wPFzWCc0TyH_gRdEKGO82fOrc6cgmR1OpzAiYK2pnP9Ut7eO8Pkxlh9y_3l5l4YeuQHgqQfd-dHxpNXqTnHqRSO_o_xyS1jPuFyVv1Ee9sb4kIOaM9zI5OExAYoiQTqgz9Qlxmor_lUfiL4")'}}>
                <div className="absolute inset-0 bg-gradient-to-t from-text-dark/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-md">
                  <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <p className="text-text-dark text-xs font-bold">Mike is 4 mins away</p>
                    <p className="text-text-muted text-[10px]">Electrical Expert</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-6 @[480px]:min-w-[400px] @[480px]:gap-8 @[864px]:justify-center @[864px]:w-1/2">
                <div className="flex flex-col gap-4 text-left">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-card px-3 py-1 shadow-sm">
                    <span className="flex size-2 rounded-full bg-success animate-pulse"></span>
                    <span className="text-xs font-medium text-text-dark">Live: 42 Pros available now</span>
                  </div>
                  <h1 className="text-text-dark text-5xl font-black leading-[0.95] tracking-[-0.033em] @[480px]:text-6xl">
                    Expert Help<br/>
                    <span className="text-primary" style={{fontSize: '3rem'}}>in 30 Mins.</span>
                  </h1>
                  <h2 className="text-text-muted text-lg font-normal leading-relaxed max-w-md">
                    Plumbing, Electrical, Cleaning. Guaranteed arrival time or the service is free.
                  </h2>
                </div>
                <label className="flex flex-col h-14 w-full max-w-[480px] @[480px]:h-16 relative group/search">
                  <div className="flex w-full flex-1 items-stretch rounded-full h-full shadow-lg shadow-primary/10 transition-shadow group-focus-within/search:shadow-primary/20 bg-card">
                    <div className="text-primary/70 flex border-none bg-card items-center justify-center pl-6 rounded-l-full">
                      <span className="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <input className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-text-dark focus:outline-0 focus:ring-0 border-none bg-card h-full placeholder:text-text-muted/50 px-4 text-base font-normal" placeholder="Enter zip code" value=""/>
                    <div className="flex items-center justify-center rounded-r-full border-none bg-card pr-2">
                      <button className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-5 @[480px]:h-12 bg-primary text-white text-base font-bold hover:bg-primary-light transition-all hover:scale-105 active:scale-95">
                        <span className="truncate">Find Help</span>
                      </button>
                    </div>
                  </div>
                </label>
                <div className="flex gap-4 items-center text-sm text-text-muted">
                  <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                  <p>Licensed &amp; Insured Professionals</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="flex flex-wrap gap-4 p-4">
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-3xl p-6 bg-card border border-slate-100 shadow-sm hover:border-primary/20 transition-colors group">
              <div className="size-10 rounded-full bg-surface flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <p className="text-text-muted text-sm font-medium leading-normal">Jobs Completed</p>
              <p className="text-text-dark tracking-tight text-3xl font-bold leading-tight">15,000+</p>
            </div>
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-3xl p-6 bg-card border border-slate-100 shadow-sm hover:border-primary/20 transition-colors group">
              <div className="size-10 rounded-full bg-surface flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">timer</span>
              </div>
              <p className="text-text-muted text-sm font-medium leading-normal">Avg Arrival Time</p>
              <p className="text-text-dark tracking-tight text-3xl font-bold leading-tight">22 min</p>
            </div>
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-3xl p-6 bg-card border border-slate-100 shadow-sm hover:border-primary/20 transition-colors group">
              <div className="size-10 rounded-full bg-surface flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">sentiment_satisfied</span>
              </div>
              <p className="text-text-muted text-sm font-medium leading-normal">Happiness Guarantee</p>
              <p className="text-text-dark tracking-tight text-3xl font-bold leading-tight">100%</p>
            </div>
          </div>
          
          {/* Instant Services */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-4 pt-8 pb-2">
              <h2 className="text-text-dark text-2xl font-bold leading-tight tracking-[-0.015em]">Instant Services</h2>
              <a className="text-primary text-sm font-bold flex items-center gap-1 hover:underline" href="#">
                View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="flex gap-3 px-4 flex-wrap">
              <button className="group flex h-12 items-center justify-center gap-x-3 rounded-full bg-card hover:bg-surface border border-slate-100 hover:border-primary/50 shadow-sm transition-all pl-4 pr-6">
                <span className="material-symbols-outlined text-primary">water_drop</span>
                <p className="text-text-dark text-base font-medium">Plumbing</p>
              </button>
              <button className="group flex h-12 items-center justify-center gap-x-3 rounded-full bg-card hover:bg-surface border border-slate-100 hover:border-primary/50 shadow-sm transition-all pl-4 pr-6">
                <span className="material-symbols-outlined text-primary">bolt</span>
                <p className="text-text-dark text-base font-medium">Electrical</p>
              </button>
              <button className="group flex h-12 items-center justify-center gap-x-3 rounded-full bg-card hover:bg-surface border border-slate-100 hover:border-primary/50 shadow-sm transition-all pl-4 pr-6">
                <span className="material-symbols-outlined text-primary">cleaning_services</span>
                <p className="text-text-dark text-base font-medium">Quick Clean</p>
              </button>
              <button className="group flex h-12 items-center justify-center gap-x-3 rounded-full bg-card hover:bg-surface border border-slate-100 hover:border-primary/50 shadow-sm transition-all pl-4 pr-6">
                <span className="material-symbols-outlined text-primary">build</span>
                <p className="text-text-dark text-base font-medium">Assembly</p>
              </button>
              <button className="group flex h-12 items-center justify-center gap-x-3 rounded-full bg-card hover:bg-surface border border-slate-100 hover:border-primary/50 shadow-sm transition-all pl-4 pr-6">
                <span className="material-symbols-outlined text-primary">lock</span>
                <p className="text-text-dark text-base font-medium">Locksmith</p>
              </button>
              <button className="group flex h-12 items-center justify-center gap-x-3 rounded-full bg-card hover:bg-surface border border-slate-100 hover:border-primary/50 shadow-sm transition-all pl-4 pr-6">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                <p className="text-text-dark text-base font-medium">Moving Help</p>
              </button>
              <button className="group flex h-12 items-center justify-center gap-x-3 rounded-full bg-card hover:bg-surface border border-slate-100 hover:border-primary/50 shadow-sm transition-all pl-4 pr-6">
                <span className="material-symbols-outlined text-primary">home_repair_service</span>
                <p className="text-text-dark text-base font-medium">Handyman</p>
              </button>
            </div>
          </div>
          
          {/* How it works */}
          <section id="how-it-works" className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">How it works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-soft border border-border px-6 py-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-semibold text-primary">
                    1
                  </div>
                  <h3 className="font-semibold text-text-primary">Request</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Choose your service and tell us what&apos;s wrong. Get an instant quote with no hidden fees.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft border border-border px-6 py-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-semibold text-primary">
                    2
                  </div>
                  <h3 className="font-semibold text-text-primary">Match</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Our algorithm finds the nearest top-rated pro in seconds and shares live ETA updates.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft border border-border px-6 py-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-semibold text-primary">
                    3
                  </div>
                  <h3 className="font-semibold text-text-primary">Relax</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Your pro arrives within 30 minutes to fix the issue. Pay securely only after you&apos;re satisfied.
                </p>
              </div>
            </div>
          </section>
          
          {/* Provider availability */}
          <section className="relative overflow-hidden rounded-3xl shadow-large">
            <div
              className="relative bg-cover bg-center"
              style={{
                backgroundImage: 'url(/city-blur.png)',
              }}
            >
              <div className="bg-gradient-to-r from-primary-900/80 via-primary-700/70 to-primary-500/60">
                <div className="px-8 py-10 lg:px-12 lg:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium text-primary-100 mb-1">Live in your neighborhood</p>
                    <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-2">
                      345 Pros in your area
                    </h2>
                    <p className="text-sm text-primary-100 max-w-md">
                      We&apos;ve expanded our network. Average response time in your neighborhood is currently{' '}
                      <span className="font-semibold text-white">14 minutes</span>.
                    </p>
                  </div>
                  <button className="px-6 h-11 rounded-full bg-white text-primary text-sm font-medium shadow-soft hover:bg-primary-50 transition-colors">
                    View Map
                  </button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Testimonials */}
          <section id="reviews" className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">What neighbors are saying</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  name: 'James D.',
                  city: 'Brooklyn, NY',
                  quote:
                    'My sink burst at 10 PM. QuickHelper had a plumber at my door in 18 minutes. Lifesaver.',
                },
                {
                  name: 'Sarah L.',
                  city: 'Austin, TX',
                  quote:
                    'The tracking feature is amazing. I knew exactly when the electrician would arrive. No more 4-hour windows.',
                },
                {
                  name: 'Emily R.',
                  city: 'San Francisco, CA',
                  quote:
                    'The pro was polite, on-time and left everything spotless. Easily the best home service experience I\'ve had.',
                },
                {
                  name: 'Marcus T.',
                  city: 'Seattle, WA',
                  quote:
                    'Booked a quick clean before my in-laws arrived. The team was efficient and thorough. Highly recommend.',
                },
              ].map((t, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-soft border border-border px-5 py-6 flex flex-col gap-4">
                  <div className="flex items-center gap-1 text-primary text-xs">
                    {'★★★★★'}
                  </div>
                  <p className="text-sm text-text-secondary">&quot;{t.quote}&quot;</p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                      <p className="text-xs text-text-muted">{t.city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-[#050316] text-white mt-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-0 py-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-3 max-w-sm">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-soft">
                  <span className="text-xl font-semibold">Q</span>
                </div>
                <span className="font-semibold tracking-tight text-lg">QuickHelper</span>
              </div>
              <p className="text-sm text-primary-100">
                The fastest way to get household problems fixed. 30 minutes or it&apos;s free. Guaranteed.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div className="space-y-3">
                <p className="font-semibold text-white/80">Company</p>
                <ul className="space-y-2 text-white/60">
                  <li>About</li>
                  <li>Careers</li>
                  <li>Blog</li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-white/80">Services</p>
                <ul className="space-y-2 text-white/60">
                  <li>Plumbing</li>
                  <li>Electrical</li>
                  <li>Cleaning</li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-white/80">Support</p>
                <ul className="space-y-2 text-white/60">
                  <li>Help Center</li>
                  <li>Terms of Service</li>
                  <li>Privacy Policy</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-white/50">
            <p>© {new Date().getFullYear()} QuickHelper Inc. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <span>Made for modern cities.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
