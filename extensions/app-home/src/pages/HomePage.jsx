import { useState, useEffect } from 'preact/hooks';

// Z4: prove to the Render backend which shop and admin user is calling, using
// Shopify's own session token (short-lived, signed by Shopify; no secret lives
// in this page). The backend rejects settings requests without it.
async function authHeaders(extra = {}) {
  const token = await shopify.auth.idToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export default function HomePage() {
  const [shopDomain, setShopDomain] = useState('');
  const [companyName, setCompanyName] = useState('EARP BROS');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [headerSubtitle, setHeaderSubtitle] = useState('Surface & Tile Specification Brief');
  const [footerDisclaimer, setFooterDisclaimer] = useState('Provisional layouts. Verify ratings against physical samples before site installation.');
  
  // Dashboard Settings Matrix Flags
  const [showDashSubtotals, setShowDashSubtotals] = useState(true);
  const [showDashMetafields, setShowDashMetafields] = useState(true);
  const [showDashPrice, setShowDashPrice] = useState(true);
  const [showDashActions, setShowDashActions] = useState(true);

  // PDF Technical Column & Metadata Rules
  const [showPdfAccountId, setShowPdfAccountId] = useState(true);
  const [showPdfGeneratedDate, setShowPdfGeneratedDate] = useState(true);
  const [pdfSectionIcon, setPdfSectionIcon] = useState('triangle');
  const [showPdfPricing, setShowPdfPricing] = useState(true);
  const [showPdfPRating, setShowPdfPRating] = useState(true);
  const [showPdfFooter, setShowPdfFooter] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop') || 'earp-bros.myshopify.com';
    setShopDomain(shop);

    (async () => {
      try {
        const res = await fetch(`https://shopify-projects-app.onrender.com/api/admin/get-settings?shop=${encodeURIComponent(shop)}`, {
          headers: await authHeaders(),
        });
        if (!res.ok) shopify.toast.show(`❌ Could not load settings (HTTP ${res.status}).`);
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setCompanyName(data.settings.company_name || 'EARP BROS');
            setPrimaryColor(data.settings.primary_color || '#0f172a');
            setHeaderSubtitle(data.settings.header_subtitle || 'Surface & Tile Specification Brief');
            setFooterDisclaimer(data.settings.footer_disclaimer || '');
            
            // Map Database Row States Back to Dashboard Components
            setShowDashSubtotals(data.settings.show_dash_subtotals !== false);
            setShowDashMetafields(data.settings.show_dash_metafields !== false);
            setShowDashPrice(data.settings.show_dash_price !== false);
            setShowDashActions(data.settings.show_dash_actions !== false);

            // Map Database Row States Back to PDF Vectors
            setShowPdfAccountId(data.settings.show_pdf_account_id !== false);
            setShowPdfGeneratedDate(data.settings.show_pdf_generated_date !== false);
            setPdfSectionIcon(data.settings.pdf_section_icon || 'triangle');
            setShowPdfPricing(data.settings.show_pricing !== false);
            setShowPdfPRating(data.settings.show_p_rating !== false);
            setShowPdfFooter(data.settings.show_footer_disclaimer !== false);
          }
        }
      } catch (e) {
        console.error("Initializing system configuration layout hooks...", e);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    const payload = {
      shopDomain,
      companyName,
      primaryColor,
      headerSubtitle,
      footerDisclaimer,
      showDashSubtotals,
      showDashMetafields,
      showDashPrice,
      showDashActions,
      showPdfAccountId,
      showPdfGeneratedDate,
      pdfSectionIcon,
      showPdfPricing,
      showPdfPRating,
      showPdfFooter
    };

    try {
      const res = await fetch('https://shopify-projects-app.onrender.com/api/admin/update-settings', {
        method: 'POST',
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        shopify.toast.show('✨ Master Control panel preferences committed!');
      } else {
        shopify.toast.show('❌ Update Rejected by Database.');
      }
    } catch (err) {
      shopify.toast.show('❌ Infrastructure transport connection lost.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <s-page heading="Loading Core Manifest...">
        <s-section><s-paragraph>Parsing structural layout preferences...</s-paragraph></s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="App Configuration Hub">
      <s-button slot="primary-action" variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Publishing Changes...' : 'Save Configuration Changes'}
      </s-button>

      {/* SECTION 1: CUSTOMER PORTAL WORKSPACE CONFIGURATION */}
      <s-section heading="1. Customer Project Dashboard Visibility">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text color="subdued">Control which explicit elements, action nodes, and product spec fields render inside the frontend customer-facing profile dashboard workspace.</s-text>
          </s-paragraph>
          
          <s-checkbox 
            label="Render Room Area and Complete Project Board Subtotal Calculations" 
            checked={showDashSubtotals} 
            onInput={(e) => setShowDashSubtotals(e.target.checked)} 
          />
          <s-checkbox 
            label="Display Item Variant Technical Metafields (Availability, Sizing, Ratings)" 
            checked={showDashMetafields} 
            onInput={(e) => setShowDashMetafields(e.target.checked)} 
          />
          <s-checkbox 
            label="Display Unit Price and Packaging Specs on Product Cards" 
            checked={showDashPrice} 
            onInput={(e) => setShowDashPrice(e.target.checked)} 
          />
          <s-checkbox 
            label="Expose Customer Interaction Action Nodes (Duplicate Card, Remove Card, Move Room)" 
            checked={showDashActions} 
            onInput={(e) => setShowDashActions(e.target.checked)} 
          />
        </s-stack>
      </s-section>

      {/* SECTION 2: PDF RENDER ENGINE CONFIGURATION */}
      <s-section heading="2. Printed PDF Engine Metadata & Columns">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text color="subdued">Configure the default typography branding variables and structural field flags printed across compilation export documents.</s-text>
          </s-paragraph>
          
          <s-text-field label="Corporate Logo Text / Title Header Name" value={companyName} onInput={(e) => setCompanyName(e.target.value)} />
          <s-text-field label="Document Description Subtitle Subhead Line" value={headerSubtitle} onInput={(e) => setHeaderSubtitle(e.target.value)} />
          <s-text-field label="Header Branding Accent Tint Identifier (Hex)" value={primaryColor} onInput={(e) => setPrimaryColor(e.target.value)} />
          <s-text-area label="Global Bottom Policy Liability & Legal Terms Declaration" value={footerDisclaimer} rows="3" onInput={(e) => setFooterDisclaimer(e.target.value)} />
          
          <div style={{ borderTop: '1px solid #eaeaea', margin: '15px 0' }}></div>
          
          {/* Metadata Flags */}
          <s-checkbox label="Display Global NetSuite Sync Account ID: Tracking Metrics" checked={showPdfAccountId} onInput={(e) => setShowPdfAccountId(e.target.checked)} />
          <s-checkbox label="Stamp Generation Date/Time Verification Metadata Code" checked={showPdfGeneratedDate} onInput={(e) => setShowPdfGeneratedDate(e.target.checked)} />
          
          {/* Column Toggle Options */}
          <s-checkbox label="Render Material Card Item Base Pricing Grid Columns" checked={showPdfPricing} onInput={(e) => setShowPdfPricing(e.target.checked)} />
          <s-checkbox label="Render Slip P-Rating Technical Engineering Specification Fields" checked={showPdfPRating} onInput={(e) => setShowPdfPRating(e.target.checked)} />
          <s-checkbox label="Output Global Footprint Liability Disclaimer Information Block" checked={showPdfFooter} onInput={(e) => setShowPdfFooter(e.target.checked)} />

          {/* Section Accordion Directory Icon Selector Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', marginTop: '5px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#202223' }}>Select Section Accordion Directory Icon Format</label>
            <select 
              value={pdfSectionIcon} 
              onChange={(e) => setPdfSectionIcon(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 10px', boxSizing: 'border-box', border: '1px solid #8c9196', borderRadius: '4px', background: '#fff', color: '#000' }}
            >
              <option value="triangle">Triangular Arrow Indicator Shape (▶ / ▼)</option>
              <option value="folder">System Asset Directory Icons (📁 / 📂)</option>
              <option value="bullet">Clean Standard Circular List Bullets (•)</option>
              <option value="none">Zero Icon Indentation Format (Hidden Layouts)</option>
            </select>
          </div>
        </s-stack>
      </s-section>
    </s-page>
  );
}