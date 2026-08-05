import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, BadgeCheck, Bell, Bike, Building2, Camera, Car, ChevronDown,
  Baby, BriefcaseBusiness, CheckCircle2, Dumbbell, Hammer, Heart, Home, Laptop,
  LockKeyhole, MapPin, Menu, MessageCircle, PawPrint, Phone, Plus, Search,
  ShieldCheck, Shirt, ShoppingBag, Smartphone, Sparkles, SprayCan, Star, Store,
  Tractor, Upload, UserRound, Wrench, X,
} from 'lucide-react'
import { supabase } from './supabase'

type Listing = {
  id: number | string
  title: string
  price: string
  location: string
  time: string
  category: string
  image: string
  verified?: boolean
  promoted?: boolean
}

const categories = [
  { name: 'Vehicles', icon: Car, tone: 'amber' },
  { name: 'Property', icon: Building2, tone: 'blue' },
  { name: 'Phones & Tablets', icon: Smartphone, tone: 'mint' },
  { name: 'Electronics', icon: Laptop, tone: 'lavender' },
  { name: 'Home, Furniture & Appliances', icon: Home, tone: 'lime' },
  { name: 'Fashion', icon: Shirt, tone: 'rose' },
  { name: 'Beauty & Personal Care', icon: SprayCan, tone: 'orange' },
  { name: 'Services', icon: Wrench, tone: 'slate' },
  { name: 'Repair & Construction', icon: Hammer, tone: 'amber' },
  { name: 'Commercial Equipment & Tools', icon: Store, tone: 'blue' },
  { name: 'Leisure & Activities', icon: Dumbbell, tone: 'lavender' },
  { name: 'Babies & Kids', icon: Baby, tone: 'rose' },
  { name: 'Food, Agriculture & Farming', icon: Tractor, tone: 'lime' },
  { name: 'Animals & Pets', icon: PawPrint, tone: 'orange' },
  { name: 'Jobs', icon: BriefcaseBusiness, tone: 'mint' },
  { name: 'Seeking Work — CVs', icon: UserRound, tone: 'slate' },
]

const listings: Listing[] = [
  { id: 1, title: 'Apple iPhone 15 Pro Max · 256GB', price: 'GH₵ 13,500', location: 'East Legon, Accra', time: '12 min ago', category: 'Phones & Tablets', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80', verified: true, promoted: true },
  { id: 2, title: 'Toyota Corolla SE · 2021', price: 'GH₵ 238,000', location: 'Airport, Accra', time: '34 min ago', category: 'Vehicles', image: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=900&q=80', verified: true },
  { id: 3, title: 'Newly built 3-bedroom house', price: 'GH₵ 1,850,000', location: 'Oyarifa, Accra', time: '1 hr ago', category: 'Property', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', promoted: true },
  { id: 4, title: 'MacBook Air M2 · 16GB RAM', price: 'GH₵ 12,800', location: 'Kumasi Central', time: '2 hrs ago', category: 'Electronics', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80', verified: true },
  { id: 5, title: 'Modern boucle lounge chair', price: 'GH₵ 2,450', location: 'Spintex, Accra', time: '3 hrs ago', category: 'Home, Furniture & Appliances', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80' },
  { id: 6, title: 'Nike Air Jordan 1 Retro High', price: 'GH₵ 1,650', location: 'Osu, Accra', time: '4 hrs ago', category: 'Fashion', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80', verified: true },
  { id: 7, title: 'Honda CBR 500R · Low mileage', price: 'GH₵ 68,000', location: 'Tema Community 12', time: '5 hrs ago', category: 'Vehicles', image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80' },
  { id: 8, title: 'Samsung 65” Crystal UHD 4K TV', price: 'GH₵ 9,200', location: 'Adum, Kumasi', time: 'Yesterday', category: 'Electronics', image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=80', promoted: true },
]

function App() {
  const [marketListings, setMarketListings] = useState<Listing[]>(() => {
    const stored = localStorage.getItem('buydey-listings-v2')
    return stored ? JSON.parse(stored) as Listing[] : listings
  })
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [saved, setSaved] = useState<Array<number | string>>(() => JSON.parse(localStorage.getItem('buydey-saved') || '[4]') as Array<number | string>)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showPostAd, setShowPostAd] = useState(false)
  const [adSubmitted, setAdSubmitted] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('buydey-user'))
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authMessage, setAuthMessage] = useState('')
  const [showDashboard, setShowDashboard] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [galleryImage, setGalleryImage] = useState<string | null>(null)
  const [showImageZoom, setShowImageZoom] = useState(false)
  const [chatText, setChatText] = useState('')
  const [messages, setMessages] = useState<string[]>(() => JSON.parse(localStorage.getItem('buydey-messages') || '[]') as string[])

  useEffect(() => localStorage.setItem('buydey-listings-v2', JSON.stringify(marketListings)), [marketListings])
  useEffect(() => localStorage.setItem('buydey-saved', JSON.stringify(saved)), [saved])
  useEffect(() => localStorage.setItem('buydey-messages', JSON.stringify(messages)), [messages])
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUser(data.session?.user.email || null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email || null
      setCurrentUser(email)
      if (email) localStorage.setItem('buydey-user', email)
      else localStorage.removeItem('buydey-user')
    })
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    supabase.from('listings')
      .select('id,title,price,location,created_at,promoted,categories(name),listing_images(storage_path,position)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data?.length) return
        const online = data.map((row: any): Listing => {
          const firstPhoto = [...(row.listing_images || [])].sort((a, b) => a.position - b.position)[0]
          return {
            id: row.id,
            title: row.title,
            price: `GH₵ ${Number(row.price).toLocaleString()}`,
            location: row.location,
            time: 'Recently',
            category: row.categories?.name || 'Other',
            image: firstPhoto ? supabase.storage.from('listing-images').getPublicUrl(firstPhoto.storage_path).data.publicUrl : listings[0].image,
            promoted: row.promoted,
          }
        })
        setMarketListings((current) => [...online, ...current.filter((item) => !online.some((live) => live.id === item.id))])
      })
  }, [])

  const filtered = useMemo(() => marketListings.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category
    const haystack = `${item.title} ${item.location} ${item.category}`.toLowerCase()
    return matchesCategory && haystack.includes(query.toLowerCase())
  }), [query, category])

  const galleryImages = useMemo(() => selectedListing ? Array.from(new Set([
    selectedListing.image,
    ...marketListings.filter((item) => item.id !== selectedListing.id && item.category === selectedListing.category).map((item) => item.image),
    ...marketListings.filter((item) => item.id !== selectedListing.id).map((item) => item.image),
  ])).slice(0, 4) : [], [selectedListing, marketListings])

  const toggleSaved = (id: number | string) => setSaved((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
  )

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthMessage('Connecting securely...')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const fullName = String(form.get('fullName') || '').trim()
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) return setAuthMessage(result.error.message)
    if (authMode === 'signup' && !result.data.session) {
      setAuthMessage('Account created. Check your email and confirm it, then sign in.')
      setAuthMode('signin')
      return
    }
    setAuthMessage('')
    setShowLogin(false)
  }

  const handlePostAd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) {
      setShowPostAd(false)
      setAuthMessage('Sign in or create a free account before publishing your ad.')
      setShowLogin(true)
      return
    }
    const form = new FormData(event.currentTarget)
    const categoryName = String(form.get('category'))
    const imageByCategory: Record<string, string> = {
      'Phones & Tablets': listings[0].image, Vehicles: listings[1].image, Property: listings[2].image,
      Electronics: listings[3].image, Fashion: listings[5].image,
      'Home, Furniture & Appliances': listings[4].image,
    }
    const newListing: Listing = {
      id: Date.now(), title: String(form.get('title')), price: `GH₵ ${Number(form.get('price')).toLocaleString()}`,
      location: String(form.get('location')), time: 'Just now', category: categoryName,
      image: imageByCategory[categoryName] || listings[0].image, verified: Boolean(currentUser),
    }
    const { data: categoryRow, error: categoryError } = await supabase.from('categories').select('id').eq('name', categoryName).single()
    if (categoryError) return window.alert(categoryError.message)
    const { data: created, error: listingError } = await supabase.from('listings').insert({
      seller_id: user.id,
      category_id: categoryRow.id,
      title: String(form.get('title')),
      description: String(form.get('description')),
      price: Number(form.get('price')),
      location: String(form.get('location')),
      condition: 'Used',
      status: 'active',
    }).select('id').single()
    if (listingError) return window.alert(listingError.message)
    newListing.id = created.id
    const photos = form.getAll('photos').filter((item): item is File => item instanceof File && item.size > 0).slice(0, 10)
    for (let index = 0; index < photos.length; index += 1) {
      const photo = photos[index]
      const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const path = `${user.id}/${created.id}/${crypto.randomUUID()}-${safeName}`
      const upload = await supabase.storage.from('listing-images').upload(path, photo)
      if (upload.error) continue
      await supabase.from('listing_images').insert({ listing_id: created.id, storage_path: path, position: index })
      if (index === 0) newListing.image = supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl
    }
    setMarketListings((current) => [newListing, ...current])
    setAdSubmitted(true)
  }

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!chatText.trim()) return
    setMessages((current) => [...current, chatText.trim()])
    setChatText('')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="utility-bar">
          <div className="container utility-inner">
            <span>Ghana’s marketplace for better deals</span>
            <div><span>Help & safety</span><span>English <ChevronDown size={13} /></span></div>
          </div>
        </div>
        <div className="container nav-bar">
          <a className="brand" href="#top" aria-label="BuyDey home">
            <span className="brand-mark"><ShoppingBag size={22} strokeWidth={2.7} /></span>
            <span>Buy<span>Dey</span></span>
          </a>
          <nav className="desktop-nav">
            <a className="active" href="#market">Marketplace</a>
            <a href="#how">How it works</a>
            <a href="#trust">Trust & safety</a>
          </nav>
          <div className="nav-actions">
            <button className="icon-button desktop-only" aria-label="Notifications"><Bell size={20} /></button>
            <button className="login-button desktop-only" onClick={() => currentUser ? setShowDashboard(true) : setShowLogin(true)}><UserRound size={19} /> {currentUser ? 'My account' : 'Sign in'}</button>
            <button className="sell-button" onClick={() => { setAdSubmitted(false); setShowPostAd(true) }}><Camera size={19} /> Post free ad</button>
            <button className="menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="mobile-nav">
            <a href="#market">Marketplace</a><a href="#how">How it works</a><a href="#trust">Trust & safety</a><button onClick={() => setShowLogin(true)}>Sign in</button>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
          <div className="container hero-content">
            <div className="hero-copy">
              <div className="eyebrow"><Sparkles size={15} /> Made for Ghana, built for everyone</div>
              <h1>Whatever you need,<br /><em>e dey here.</em></h1>
              <p>Discover trusted sellers, compare real prices, and find great deals close to you.</p>
            </div>
            <div className="search-panel">
              <div className="search-row">
                <div className="search-input-wrap">
                  <Search size={22} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What are you looking for?" aria-label="Search listings" />
                </div>
                <button className="location-select"><MapPin size={20} /><span>All Ghana</span><ChevronDown size={17} /></button>
                <a className="search-button" href="#market">Search</a>
              </div>
              <div className="popular-searches"><span>Popular:</span><button onClick={() => setQuery('iPhone')}>iPhone 15</button><button onClick={() => setQuery('Toyota')}>Toyota Corolla</button><button onClick={() => setQuery('house')}>Houses for rent</button></div>
            </div>
            <div className="hero-stats">
              <div><strong>12K+</strong><span>Fresh listings</span></div>
              <div><strong>8K+</strong><span>Trusted sellers</span></div>
              <div><strong>16</strong><span>Regions covered</span></div>
            </div>
          </div>
        </section>

        <section className="categories-section">
          <div className="container">
            <div className="section-heading compact"><div><span className="kicker">Browse</span><h2>Explore categories</h2></div><button className="text-link" onClick={() => setCategory('All')}>View all <ArrowRight size={17} /></button></div>
            <div className="category-grid">
              {categories.map(({ name, icon: Icon, tone }) => (
                <button key={name} className={`category-card ${category === name ? 'selected' : ''}`} onClick={() => setCategory(category === name ? 'All' : name)}>
                  <span className={`category-icon ${tone}`}><Icon size={25} /></span>
                  <span>{name}</span><small>{name === 'More' ? 'All categories' : `${Math.floor(320 + name.length * 113)} ads`}</small>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="market-section" id="market">
          <div className="container">
            <div className="section-heading">
              <div><span className="kicker">Fresh near you</span><h2>{category === 'All' ? 'Trending listings' : category}</h2><p>Hand-picked deals from sellers across Ghana.</p></div>
              <button className="text-link">See all listings <ArrowRight size={17} /></button>
            </div>
            {filtered.length ? (
              <div className="listing-grid">
                {filtered.map((item) => (
                  <article className="listing-card" key={item.id} onClick={() => { setGalleryImage(item.image); setSelectedListing(item) }} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') { setGalleryImage(item.image); setSelectedListing(item) } }}>
                    <div className="listing-image">
                      <img src={item.image} alt={item.title} />
                      <div className="card-badges">{item.promoted && <span>Featured</span>}</div>
                      <button className={`save-button ${saved.includes(item.id) ? 'saved' : ''}`} onClick={(event) => { event.stopPropagation(); toggleSaved(item.id) }} aria-label="Save listing"><Heart size={20} fill={saved.includes(item.id) ? 'currentColor' : 'none'} /></button>
                    </div>
                    <div className="listing-body">
                      <div className="listing-meta"><span>{item.category}</span><span>{item.time}</span></div>
                      <h3>{item.title}</h3>
                      <strong className="price">{item.price}</strong>
                      <div className="seller-line"><MapPin size={15} /><span>{item.location}</span>{item.verified && <BadgeCheck size={16} className="verified" />}</div>
                    </div>
                  </article>
                ))}
              </div>
            ) : <div className="empty-state"><Search size={36} /><h3>No matching listings yet</h3><p>Try a different search or category.</p><button onClick={() => { setQuery(''); setCategory('All') }}>Clear filters</button></div>}
          </div>
        </section>

        <section className="trust-section" id="trust">
          <div className="container trust-panel">
            <div className="trust-copy"><span className="trust-icon"><ShieldCheck size={26} /></span><span className="kicker">BuyDey protection</span><h2>Deals feel better<br />when they feel safe.</h2><p>We’re building trust into every step—from verified sellers and smarter moderation to simple reporting when something doesn’t feel right.</p><a href="/safety.html">Explore our safety centre <ArrowRight size={17} /></a></div>
            <div className="trust-features">
              <div><span><BadgeCheck /></span><h3>Verified sellers</h3><p>Identity checks help you know who you’re dealing with.</p></div>
              <div><span><MessageCircle /></span><h3>Safer conversations</h3><p>Keep your discussions organized and protected in one place.</p></div>
              <div><span><Star /></span><h3>Real reputation</h3><p>Ratings and transaction history make good sellers stand out.</p></div>
              <div><span><Bell /></span><h3>Smart alerts</h3><p>We flag suspicious behaviour before it becomes a problem.</p></div>
            </div>
          </div>
        </section>

        <section className="how-section" id="how">
          <div className="container">
            <div className="section-heading centered"><div><span className="kicker">Simple by design</span><h2>From “I need it” to “I found it”</h2></div></div>
            <div className="steps">
              <div><span>01</span><Search /><h3>Search what you need</h3><p>Browse thousands of fresh listings near you.</p></div>
              <div><span>02</span><MessageCircle /><h3>Talk to the seller</h3><p>Ask questions, negotiate, and agree safely.</p></div>
              <div><span>03</span><ShoppingBag /><h3>Make a great deal</h3><p>Meet safely, inspect the item, and enjoy.</p></div>
            </div>
          </div>
        </section>

        <section className="sell-cta">
          <div className="container sell-cta-inner"><div><span className="kicker">Always free to list</span><h2>Something to sell?<br />Someone wants it.</h2><p>Sellers can post ordinary ads without paying any listing fee.</p></div><button onClick={() => { setAdSubmitted(false); setShowPostAd(true) }}><Camera /> Post an ad for free <ArrowRight /></button></div>
        </section>
      </main>

      <footer><div className="container footer-inner"><a className="brand footer-brand" href="#top"><span className="brand-mark"><ShoppingBag size={20} /></span><span>Buy<span>Dey</span></span></a><p>Everything you need dey here.</p><div className="footer-links"><a href="#top">About</a><a href="/safety.html">Safety</a><a href="mailto:help@buydey.com">Help</a><a href="/terms.html">Terms</a><a href="/privacy.html">Privacy</a></div><small>© 2026 BuyDey Ghana. Built with care.</small></div></footer>

      <nav className="mobile-bottom-nav">
        <a className="active" href="#top"><Home /><span>Home</span></a><a href="#market"><Search /><span>Browse</span></a><button onClick={() => { setAdSubmitted(false); setShowPostAd(true) }} aria-label="Post an ad"><Camera /></button><button className="profile-tab" onClick={() => setShowChat(true)}><MessageCircle /><span>Chats</span></button><button className="profile-tab" onClick={() => currentUser ? setShowDashboard(true) : setShowLogin(true)}><UserRound /><span>Profile</span></button>
      </nav>

      {selectedListing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedListing(null)}>
          <section className="modal-card detail-modal" role="dialog" aria-modal="true" aria-label="Listing details" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedListing(null)} aria-label="Close"><X /></button>
            <div className="detail-gallery"><button className="detail-photo" onClick={() => setShowImageZoom(true)} aria-label="Open full product image"><img src={galleryImage || selectedListing.image} alt={selectedListing.title} />{selectedListing.promoted && <span>Featured listing</span>}<small>Tap image to view full size</small></button><div className="detail-thumbs">{galleryImages.map((image, index) => <button className={(galleryImage || selectedListing.image) === image ? 'active' : ''} onClick={() => setGalleryImage(image)} key={image}><img src={image} alt={`${selectedListing.title} view ${index + 1}`} /></button>)}</div></div>
            <div className="detail-content">
              <div className="detail-label">{selectedListing.category} · {selectedListing.time}</div>
              <h2>{selectedListing.title}</h2>
              <strong>{selectedListing.price}</strong>
              <p className="detail-location"><MapPin /> {selectedListing.location}</p>
              <div className="detail-divider" />
              <h3>Description</h3>
              <p className="detail-description">Clean, carefully used and in excellent condition. What you see is exactly what you get. Inspection is welcome before payment.</p>
              <div className="seller-box">
                <div className="seller-avatar">KA</div><div><b>Kofi’s Verified Store <BadgeCheck size={16} /></b><span>Member since 2024 · Usually replies in minutes</span></div><Star size={17} fill="currentColor" /><b>4.9</b>
              </div>
              <div className="detail-actions"><button onClick={() => setShowChat(true)}><MessageCircle /> Chat with seller</button><button><Phone /> Show number</button></div>
              <p className="safety-note"><ShieldCheck /> Never pay before inspecting an item in person.</p>
            </div>
          </section>
        </div>
      )}

      {showLogin && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowLogin(false)}>
          <section className="modal-card auth-modal" role="dialog" aria-modal="true" aria-label="Sign in" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogin(false)} aria-label="Close"><X /></button>
            <span className="auth-icon"><LockKeyhole /></span><span className="kicker">Welcome back</span><h2>Sign in to BuyDey</h2><p>Save listings, chat with sellers, and manage your ads.</p>
            <form onSubmit={handleLogin}>
              {authMode === 'signup' && <label>Full name<input name="fullName" placeholder="Your full name" required /></label>}
              <label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label>
              <label>Password<input name="password" type="password" placeholder="Enter your password" required /></label>
              <div className="form-helper"><label><input type="checkbox" /> Remember me</label><button type="button">Forgot password?</button></div>
              {authMessage && <p className="auth-message">{authMessage}</p>}
              <button className="primary-form-button" type="submit">{authMode === 'signup' ? 'Create free account' : 'Sign in'} <ArrowRight /></button>
            </form>
            <div className="auth-footer">{authMode === 'signin' ? 'New to BuyDey?' : 'Already registered?'} <button onClick={() => { setAuthMessage(''); setAuthMode(authMode === 'signin' ? 'signup' : 'signin') }}>{authMode === 'signin' ? 'Create a free account' : 'Sign in'}</button></div>
          </section>
        </div>
      )}

      {showPostAd && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowPostAd(false)}>
          <section className="modal-card post-modal" role="dialog" aria-modal="true" aria-label="Post an ad" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPostAd(false)} aria-label="Close"><X /></button>
            {adSubmitted ? <div className="success-state"><span><CheckCircle2 /></span><h2>Your draft is ready!</h2><p>Sign in to publish your listing and start receiving offers.</p><button className="primary-form-button" onClick={() => { setShowPostAd(false); setShowLogin(true) }}>Continue to sign in <ArrowRight /></button></div> : <>
              <span className="kicker">Sell on BuyDey</span><h2>What are you selling?</h2><p>Add clear details to help buyers find your item faster.</p>
              <form onSubmit={handlePostAd}>
                <label className="upload-box"><Upload /><b>Add product photos</b><span>Up to 10 clear images · JPG, PNG or WebP</span><input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
                <div className="free-listing-note"><CheckCircle2 /> Standard listings are completely free. No card or mobile-money payment required.</div>
                <div className="form-grid"><label>Ad title<input name="title" placeholder="e.g. iPhone 15 Pro Max 256GB" required /></label><label>Category<select name="category" required defaultValue=""><option value="" disabled>Select a category</option>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select></label></div>
                <div className="form-grid"><label>Price (GH₵)<input name="price" type="number" min="1" placeholder="0.00" required /></label><label>Location<select name="location" required defaultValue=""><option value="" disabled>Select your region</option><option>Greater Accra</option><option>Ashanti</option><option>Central</option><option>Eastern</option><option>Western</option><option>Northern</option></select></label></div>
                <label>Description<textarea name="description" placeholder="Describe the condition, important features and what is included..." rows={4} required /></label>
                <button className="primary-form-button" type="submit"><Plus /> Create listing draft</button>
              </form>
            </>}
          </section>
        </div>
      )}

      {showImageZoom && selectedListing && (
        <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Full product image" onClick={() => setShowImageZoom(false)}><button aria-label="Close full product image"><X /></button><img src={galleryImage || selectedListing.image} alt={selectedListing.title} /><div>{selectedListing.title} · {selectedListing.price}</div></div>
      )}

      {showDashboard && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowDashboard(false)}>
          <section className="modal-card dashboard-modal" role="dialog" aria-modal="true" aria-label="My BuyDey account" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDashboard(false)} aria-label="Close"><X /></button>
            <div className="dashboard-header"><div className="seller-avatar">{currentUser?.slice(-2) || 'BD'}</div><div><span className="kicker">My BuyDey</span><h2>Welcome back</h2><p>{currentUser}</p></div></div>
            <div className="dashboard-stats"><div><strong>{marketListings.length}</strong><span>Live listings</span></div><div><strong>{saved.length}</strong><span>Saved items</span></div><div><strong>{messages.length}</strong><span>Messages</span></div></div>
            <div className="dashboard-actions"><button onClick={() => { setShowDashboard(false); setAdSubmitted(false); setShowPostAd(true) }}><Plus /> Post a new ad</button><button onClick={() => { setShowDashboard(false); setShowChat(true) }}><MessageCircle /> Open messages</button></div>
            <h3>Recently listed</h3><div className="mini-listings">{marketListings.slice(0, 3).map((item) => <button key={item.id} onClick={() => { setShowDashboard(false); setSelectedListing(item) }}><img src={item.image} alt="" /><span><b>{item.title}</b><small>{item.price} · {item.location}</small></span><ArrowRight /></button>)}</div>
            <button className="signout-button" onClick={async () => { await supabase.auth.signOut(); localStorage.removeItem('buydey-user'); setCurrentUser(null); setShowDashboard(false) }}>Sign out</button>
          </section>
        </div>
      )}

      {showChat && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowChat(false)}>
          <section className="modal-card chat-modal" role="dialog" aria-modal="true" aria-label="BuyDey messages" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowChat(false)} aria-label="Close"><X /></button>
            <div className="chat-header"><div className="seller-avatar">KA</div><div><b>Kofi’s Verified Store</b><span><i /> Online now</span></div></div>
            <div className="chat-context">{selectedListing && <><img src={selectedListing.image} alt="" /><span><b>{selectedListing.title}</b><small>{selectedListing.price}</small></span></>}</div>
            <div className="chat-messages"><div className="message incoming">Hello 👋 Is this item still available?</div>{messages.map((message, index) => <div className="message outgoing" key={`${message}-${index}`}>{message}<small>Delivered</small></div>)}</div>
            <form className="chat-form" onSubmit={sendMessage}><input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Type a message..." aria-label="Message" /><button type="submit" aria-label="Send message"><ArrowRight /></button></form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
