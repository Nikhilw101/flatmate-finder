import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import listingService from '../services/listing.service';
import ListingCard from '../components/listing/ListingCard';
import { useAuth } from '../hooks/useAuth';
import compatibilityService from '../services/compatibility.service';
import SkeletonListingCard from '../components/listing/SkeletonListingCard';
import { MapPin } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [totalListings, setTotalListings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({ location: '', minRent: '', maxRent: '', availableFrom: '' });

  useEffect(() => {
    // Reveal animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Fetch featured listings
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        if (user?.role === 'TENANT') {
          const res = await compatibilityService.getBrowseListings();
          if (res.success) {
            const mapped = res.data.slice(0, 3).map(item => ({
              ...item.listing,
              compatibility: { score: item.score, explanation: item.explanation }
            }));
            setFeaturedListings(mapped);
            setTotalListings(res.data.length || 12400);
          }
        } else {
          const res = await listingService.getAll({ limit: 3, sort: 'newest' });
          if (res.success) {
            setFeaturedListings(res.data.listings);
            setTotalListings(res.data.pagination?.total || 12400); // Fallback to reference design number
          }
        }
      } catch (err) {
        console.error('Failed to fetch featured listings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
    
    return () => observer.disconnect();
  }, [user]);

  const handleSearch = () => {
    const q = new URLSearchParams();
    if (searchParams.location) q.append('location', searchParams.location);
    if (searchParams.minRent) q.append('minRent', searchParams.minRent);
    if (searchParams.maxRent) q.append('maxRent', searchParams.maxRent);
    navigate(`/listings?${q.toString()}`);
  };

  return (
    <div id="top" style={{ paddingTop: '20px' }}>
      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow"><span className="dot"></span>AI-matched living, not random roommates</div>
            <h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span>Find a home.<br/>Find your <span className="accent">people.</span></span>
              <span style={{ 
                display: 'inline-block', width: 72, height: 40, 
                borderRadius: 40, overflow: 'hidden', 
                boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                marginTop: 8
              }}>
                <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=150&q=80" alt="Friends" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </span>
            </h1>
            <p className="hero-sub">HomeSync pairs verified rentals with flatmates who actually fit your budget, habits, and daily rhythm — scored by AI, decided by you.</p>

            <div className="search-pill">
              <div className="search-field">
                <label>Location</label>
                <input type="text" placeholder="Bengaluru, Indiranagar" value={searchParams.location} onChange={e => setSearchParams({...searchParams, location: e.target.value})} />
              </div>
              <div className="search-field">
                <label>Budget / mo</label>
                <input type="text" placeholder="15000" value={searchParams.minRent} onChange={e => setSearchParams({...searchParams, minRent: e.target.value})} />
              </div>
              <button className="search-go" aria-label="Search" onClick={handleSearch}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            <div className="hero-cta-row">
              <Link className="btn btn-dark" to="/register">See my Fit Score <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></Link>
              <Link className="link-cta" to="/listings">Browse all homes <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></Link>
            </div>

            <div className="stat-row">
              <div><div className="stat-num">{totalListings.toLocaleString('en-IN')}</div><div className="stat-label">Available homes</div></div>
              <div><div className="stat-num">94%</div><div className="stat-label">Avg. match satisfaction</div></div>
              <div><div className="stat-num">48h</div><div className="stat-label">Avg. time to first match</div></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="float-card fc-main">
              <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=70" alt="Bright modern apartment living room" />
              <div className="fc-body">
                <div className="fc-price">₹22,000 <span>/ month</span></div>
                <div className="fc-loc">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" stroke="#8A8A8A" strokeWidth="2"/><circle cx="12" cy="9" r="2.4" stroke="#8A8A8A" strokeWidth="2"/></svg>
                  Indiranagar, Bengaluru
                </div>
              </div>
            </div>
            <div className="float-card fc-score">
              <div className="fc-score-top">
                <svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="#F2F2F2" strokeWidth="4"/><circle cx="20" cy="20" r="16" fill="none" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" strokeDasharray="100" strokeDashoffset="12" transform="rotate(-90 20 20)"/></svg>
                <div>
                  <div className="fc-score-label">Fit Score</div>
                  <div className="fc-score-num">91%</div>
                </div>
              </div>
            </div>
            <div className="float-card fc-verify">
              <div className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#22C55E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
              <div>
                <div style={{fontSize: 13, fontWeight: 700}}>ID Verified</div>
                <div style={{fontSize: 11.5, color: 'var(--text-muted)'}}>Priya, 26 · Designer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="trust-strip">
        <div className="wrap trust-row">
          <div className="trust-item"><span className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" stroke="currentColor" strokeWidth="1.8"/></svg></span> Identity verified users</div>
          <div className="trust-item"><span className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M12 3l8 4v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V7l8-4Z" stroke="currentColor" strokeWidth="1.8"/></svg></span> Background-checked landlords</div>
          <div className="trust-item"><span className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></span> Transparent lease terms</div>
          <div className="trust-item"><span className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></span> Support in under 10 minutes</div>
        </div>
      </div>

      {/* FEATURED LISTINGS */}
      <section id="listings">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="sec-eyebrow">Featured this week</div>
            <h2 className="sec-title">Homes worth moving for</h2>
            <p className="sec-desc">Every listing is walked through by our team and matched against real compatibility data before it ever reaches your feed.</p>
          </div>

          <div className="listing-grid">
            {loading ? (
              <>
                <SkeletonListingCard />
                <SkeletonListingCard />
                <SkeletonListingCard />
              </>
            ) : (
              featuredListings.map(listing => (
                <ListingCard key={listing._id} listing={listing} compatibility={listing.compatibility} />
              ))
            )}
          </div>
          
          <div className="reveal" style={{ marginTop: 40, textAlign: 'center' }}>
            <Link className="btn btn-outline" to="/listings">View all rooms</Link>
          </div>
        </div>
      </section>

      {/* AI COMPATIBILITY */}
      <section id="ai" className="ai-section">
        <div className="wrap">
          <div className="ai-grid">
            <div className="reveal">
              <div className="sec-eyebrow ai">The Fit Score</div>
              <h2 className="sec-title">Compatibility isn't a guess. It's a score.</h2>
              <p className="sec-desc">We ask both sides real questions — sleep schedule, noise tolerance, cleanliness, guests, budget flexibility — and weigh them into one honest number. Hover a line to see how it's built.</p>

              <div className="dim-list">
                <div className="dim-row">
                  <div className="dim-top"><span className="dim-name">Lifestyle & routine</span><span className="dim-val">88%</span></div>
                  <div className="dim-bar-track"><div className="dim-bar-fill" style={{width: '88%'}}></div></div>
                </div>
                <div className="dim-row">
                  <div className="dim-top"><span className="dim-name">Cleanliness habits</span><span className="dim-val">95%</span></div>
                  <div className="dim-bar-track"><div className="dim-bar-fill" style={{width: '95%'}}></div></div>
                </div>
                <div className="dim-row">
                  <div className="dim-top"><span className="dim-name">Budget alignment</span><span className="dim-val">90%</span></div>
                  <div className="dim-bar-track"><div className="dim-bar-fill" style={{width: '90%'}}></div></div>
                </div>
              </div>
            </div>

            <div className="ring-wrap reveal">
              <div className="ring-card">
                <svg className="ring-svg" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="88" fill="none" stroke="#F2F2F2" strokeWidth="10"/>
                  <circle className="ring-arc" cx="100" cy="100" r="88" fill="none" stroke="#2563EB" strokeWidth="10" strokeLinecap="round" strokeDasharray="553" strokeDashoffset="55" transform="rotate(-90 100 100)"/>
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#F2F2F2" strokeWidth="10"/>
                  <circle className="ring-arc" cx="100" cy="100" r="70" fill="none" stroke="#7C3AED" strokeWidth="10" strokeLinecap="round" strokeDasharray="440" strokeDashoffset="44" transform="rotate(-90 100 100)"/>
                  <circle cx="100" cy="100" r="52" fill="none" stroke="#F2F2F2" strokeWidth="10"/>
                  <circle className="ring-arc" cx="100" cy="100" r="52" fill="none" stroke="#22C55E" strokeWidth="10" strokeLinecap="round" strokeDasharray="327" strokeDashoffset="32" transform="rotate(-90 100 100)"/>
                  <text x="100" y="96" textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize="34" fill="#111111">91%</text>
                  <text x="100" y="118" textAnchor="middle" fontFamily="Inter" fontWeight="600" fontSize="11" fill="#8A8A8A">OVERALL FIT</text>
                </svg>
                <div className="ring-names">
                  <div className="ring-legend"><span className="sw" style={{background: '#2563EB'}}></span>Lifestyle</div>
                  <div className="ring-legend"><span className="sw" style={{background: '#7C3AED'}}></span>Personality</div>
                  <div className="ring-legend"><span className="sw" style={{background: '#22C55E'}}></span>Budget</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="sec-eyebrow">The process</div>
            <h2 className="sec-title">Three steps, in order</h2>
            <p className="sec-desc">Each step feeds the next — your profile shapes your matches, your matches shape your shortlist.</p>
          </div>
          <div className="steps-row">
            <div className="step reveal">
              <div className="step-num">01</div>
              <div className="step-title">Tell us how you actually live</div>
              <div className="step-desc">A five-minute profile on sleep, noise, cleanliness, guests, and budget — no generic surveys.</div>
            </div>
            <div className="step reveal">
              <div className="step-num">02</div>
              <div className="step-title">Get matched, not just listed</div>
              <div className="step-desc">We rank homes and flatmates by Fit Score, so the top result is genuinely your best option.</div>
            </div>
            <div className="step reveal">
              <div className="step-num">03</div>
              <div className="step-title">Move in with confidence</div>
              <div className="step-desc">Verified IDs, transparent lease terms, and a support team that answers in minutes, not days.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CITIES */}
      <section id="cities" style={{background: 'var(--bg-section)'}}>
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="sec-eyebrow">Where HomeSync lives</div>
            <h2 className="sec-title">Popular cities</h2>
            <p className="sec-desc">Growing fastest in India's tech hubs — new cities added every quarter.</p>
          </div>
          <div className="city-grid">
            <Link className="city-card reveal" to="/listings?location=Bengaluru">
              <img src="https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=500&auto=format&fit=crop&q=70" alt="Bengaluru skyline" />
              <div className="city-overlay"></div>
              <div className="city-info">
                <div className="city-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={18} /> Bengaluru</div>
                <div className="city-count">Active Area</div>
              </div>
            </Link>
            <Link className="city-card reveal" to="/listings?location=Mumbai">
              <img src="https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=500&auto=format&fit=crop&q=70" alt="Mumbai coastline" />
              <div className="city-overlay"></div>
              <div className="city-info">
                <div className="city-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={18} /> Mumbai</div>
                <div className="city-count">Active Area</div>
              </div>
            </Link>
            <Link className="city-card reveal" to="/listings?location=Delhi">
              <img src="https://images.unsplash.com/photo-1587474260584-136574528ed5?w=500&auto=format&fit=crop&q=70" alt="Delhi city view" />
              <div className="city-overlay"></div>
              <div className="city-info">
                <div className="city-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={18} /> Delhi NCR</div>
                <div className="city-count">Active Area</div>
              </div>
            </Link>
            <Link className="city-card reveal" to="/listings?location=Pune">
              <img src="https://images.unsplash.com/photo-1595928642581-f50f4f3453a5?w=500&auto=format&fit=crop&q=70" alt="Pune street view" />
              <div className="city-overlay"></div>
              <div className="city-info">
                <div className="city-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={18} /> Pune</div>
                <div className="city-count">Active Area</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section>
        <div className="wrap reveal">
          <div className="cta-band">
            <h2>Ready to find your match?</h2>
            <p>Join thousands of verified renters and landlords already using HomeSync.</p>
            <form className="cta-form" onSubmit={e => {e.preventDefault(); navigate('/register')}}>
              <input type="email" placeholder="Enter your email address" required />
              <button type="submit">Get Started</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
