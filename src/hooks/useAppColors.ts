import { useApp } from '../contexts/AppContext';

export function useAppColors() {
  const { appType } = useApp();
  
  const isIsabelle = appType === 'isabellenails';
  
  // Palette: #faede0 (crema), #c2886d (terracotta)
  const terracotta = '#c2886d';
  const terracottaDark = '#a06d52';
  const terracottaLight = '#e8c4b8';

  return {
    // Primary colors
    primary: isIsabelle ? '#9C27B0' : terracotta,
    primaryLight: isIsabelle ? '#BA68C8' : terracottaLight,
    primaryDark: isIsabelle ? '#7B1FA2' : terracottaDark,
    
    // Gradient colors (Tailwind)
    gradientFrom: isIsabelle ? 'from-purple-500' : 'from-[#c2886d]',
    gradientTo: isIsabelle ? 'to-purple-600' : 'to-[#a06d52]',
    gradientVia: isIsabelle ? 'via-purple-400' : 'via-[#c2886d]',
    gradientFromLight: isIsabelle ? 'from-purple-400' : 'from-[#c2886d]',
    gradientToLight: isIsabelle ? 'to-purple-500' : 'to-[#a06d52]',
    
    // Background colors
    bgGradient: isIsabelle 
      ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
      : 'bg-gradient-to-br from-[#c2886d] to-[#a06d52]',
    bgGradientLight: isIsabelle 
      ? 'bg-gradient-to-r from-purple-500/5 to-purple-600/5' 
      : 'bg-gradient-to-r from-[#c2886d]/5 to-[#a06d52]/5',
    bgGradientHover: isIsabelle 
      ? 'bg-gradient-to-r from-purple-50 to-purple-100/50' 
      : 'bg-gradient-to-r from-[#faede0] to-[#e8c4b8]/50',
    
    // Text colors
    textPrimary: isIsabelle ? 'text-purple-600' : 'text-[#c2886d]',
    textPrimaryDark: isIsabelle ? 'text-purple-400' : 'text-[#a06d52]',
    textHover: isIsabelle ? 'group-hover:text-purple-600' : 'group-hover:text-[#c2886d]',
    textHoverDark: isIsabelle ? 'group-hover:text-purple-400' : 'group-hover:text-[#a06d52]',
    
    // Background colors for elements (crema #faede0)
    bgPrimary: isIsabelle ? 'bg-purple-100' : 'bg-[#faede0]',
    bgPrimaryDark: isIsabelle ? 'bg-purple-900/30' : 'bg-[#c2886d]/20',
    bgHover: isIsabelle ? 'group-hover:bg-purple-100' : 'group-hover:bg-[#faede0]',
    bgHoverDark: isIsabelle ? 'group-hover:bg-purple-900/30' : 'group-hover:bg-[#c2886d]/20',
    
    // Border colors
    borderPrimary: isIsabelle ? 'border-purple-500' : 'border-[#c2886d]',
    borderHover: isIsabelle ? 'hover:border-purple-300' : 'hover:border-[#c2886d]',
    
    // Shadow colors
    shadowPrimary: isIsabelle ? 'shadow-purple-500/25' : 'shadow-[#c2886d]/25',
    shadowPrimaryLight: isIsabelle ? 'shadow-purple-500/10' : 'shadow-[#c2886d]/10',
    
    // Focus ring colors
    focusRing: isIsabelle ? 'focus:ring-purple-500' : 'focus:ring-[#c2886d]',
    
    // CSS custom properties for inline styles
    cssGradient: isIsabelle 
      ? 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #6A1B9A 100%)'
      : `linear-gradient(135deg, ${terracotta} 0%, ${terracottaDark} 50%, #8b5a3c 100%)`,
    cssGradientLight: isIsabelle 
      ? 'linear-gradient(90deg, #9C27B0/20 0%, #7B1FA2/20 100%)'
      : `linear-gradient(90deg, ${terracotta}20 0%, ${terracottaDark}20 100%)`,
  };
}
