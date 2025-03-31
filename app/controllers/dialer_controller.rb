class DialerController < ApplicationController
  def index
    @countries = countries_data
  end

  def test
    # Simple test action for the active call screen
    @countries = countries_data
  end

  private

  def countries_data
    [
      { name: "United States", code: "US", dial_code: "+1", flag: "🇺🇸" },
      { name: "United Kingdom", code: "GB", dial_code: "+44", flag: "🇬🇧" },
      { name: "Canada", code: "CA", dial_code: "+1", flag: "🇨🇦" },
      { name: "Australia", code: "AU", dial_code: "+61", flag: "🇦🇺" },
      { name: "Germany", code: "DE", dial_code: "+49", flag: "🇩🇪" },
      { name: "France", code: "FR", dial_code: "+33", flag: "🇫🇷" },
      { name: "Spain", code: "ES", dial_code: "+34", flag: "🇪🇸" },
      { name: "Italy", code: "IT", dial_code: "+39", flag: "🇮🇹" },
      { name: "Japan", code: "JP", dial_code: "+81", flag: "🇯🇵" },
      { name: "China", code: "CN", dial_code: "+86", flag: "🇨🇳" },
      { name: "India", code: "IN", dial_code: "+91", flag: "🇮🇳" },
      { name: "Brazil", code: "BR", dial_code: "+55", flag: "🇧🇷" },
      { name: "Mexico", code: "MX", dial_code: "+52", flag: "🇲🇽" },
      { name: "South Korea", code: "KR", dial_code: "+82", flag: "🇰🇷" },
      { name: "Netherlands", code: "NL", dial_code: "+31", flag: "🇳🇱" },
      { name: "Sweden", code: "SE", dial_code: "+46", flag: "🇸🇪" },
      { name: "Norway", code: "NO", dial_code: "+47", flag: "🇳🇴" },
      { name: "Denmark", code: "DK", dial_code: "+45", flag: "🇩🇰" },
      { name: "Finland", code: "FI", dial_code: "+358", flag: "🇫🇮" },
      { name: "Switzerland", code: "CH", dial_code: "+41", flag: "🇨🇭" },
      { name: "Ireland", code: "IE", dial_code: "+353", flag: "🇮🇪" },
      { name: "New Zealand", code: "NZ", dial_code: "+64", flag: "🇳🇿" },
      { name: "Singapore", code: "SG", dial_code: "+65", flag: "🇸🇬" },
      { name: "Israel", code: "IL", dial_code: "+972", flag: "🇮🇱" },
      { name: "South Africa", code: "ZA", dial_code: "+27", flag: "🇿🇦" }
    ]
  end
end 