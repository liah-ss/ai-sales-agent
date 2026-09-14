export interface LocalizedSiteSettings {
  tagline?: string
  company_address?: string
  footer_description?: string
  topbar_slogan_text?: string
  topbar_phone_text?: string
  topbar_whatsapp_text?: string
  topbar_login_text?: string
  topbar_register_text?: string
  home_hero_title?: string
  home_hero_subtitle?: string
  home_hero_badge?: string
  home_primary_cta_text?: string
  home_secondary_cta_text?: string
  home_contact_title?: string
  home_contact_subtitle?: string
}

export interface SiteSettings {
  brand_name: string
  tagline: string
  seo_title: string
  seo_description: string
  whatsapp_number: string
  facebook_url: string
  linkedin_url: string
  sales_email: string
  phone: string
  topbar_slogan_text: string
  topbar_phone_text: string
  topbar_whatsapp_text: string
  topbar_login_text: string
  topbar_register_text: string
  company_address: string
  supported_languages: string[]
  footer_description: string
  home_hero_title: string
  home_hero_subtitle: string
  home_hero_badge: string
  home_primary_cta_text: string
  home_primary_cta_url: string
  home_secondary_cta_text: string
  home_secondary_cta_url: string
  home_contact_title: string
  home_contact_subtitle: string
  home_metrics: Array<{
    value: string
    label: string
    description: string | null
    labelTranslations?: Partial<Record<'en' | 'id', string>>
    descriptionTranslations?: Partial<Record<'en' | 'id', string>>
  }>
  translations?: Partial<Record<'en' | 'id', LocalizedSiteSettings>>
}
