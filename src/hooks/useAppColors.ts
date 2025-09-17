import { useApp } from '../contexts/AppContext';

export function useAppColors() {
  const { appType } = useApp();
  
  const isIsabelle = appType === 'isabellenails';
  
  return {
    // Primary colors
    primary: isIsabelle ? '#9C27B0' : '#E91E63',
    primaryLight: isIsabelle ? '#BA68C8' : '#F8BBD9',
    primaryDark: isIsabelle ? '#7B1FA2' : '#C2185B',
    
    // Gradient colors
    gradientFrom: isIsabelle ? 'from-purple-500' : 'from-pink-500',
    gradientTo: isIsabelle ? 'to-purple-600' : 'to-pink-600',
    gradientFromLight: isIsabelle ? 'from-purple-400' : 'from-pink-400',
    gradientToLight: isIsabelle ? 'to-purple-500' : 'to-pink-500',
    
    // Background colors
    bgGradient: isIsabelle 
      ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
      : 'bg-gradient-to-br from-pink-500 to-pink-600',
    bgGradientLight: isIsabelle 
      ? 'bg-gradient-to-r from-purple-500/5 to-purple-600/5' 
      : 'bg-gradient-to-r from-pink-500/5 to-pink-600/5',
    bgGradientHover: isIsabelle 
      ? 'bg-gradient-to-r from-purple-50 to-purple-100/50' 
      : 'bg-gradient-to-r from-pink-50 to-pink-100/50',
    
    // Text colors
    textPrimary: isIsabelle ? 'text-purple-600' : 'text-pink-600',
    textPrimaryDark: isIsabelle ? 'text-purple-400' : 'text-pink-400',
    textHover: isIsabelle ? 'group-hover:text-purple-600' : 'group-hover:text-pink-600',
    textHoverDark: isIsabelle ? 'group-hover:text-purple-400' : 'group-hover:text-pink-400',
    
    // Background colors for elements
    bgPrimary: isIsabelle ? 'bg-purple-100' : 'bg-pink-100',
    bgPrimaryDark: isIsabelle ? 'bg-purple-900/30' : 'bg-pink-900/30',
    bgHover: isIsabelle ? 'group-hover:bg-purple-100' : 'group-hover:bg-pink-100',
    bgHoverDark: isIsabelle ? 'group-hover:bg-purple-900/30' : 'group-hover:bg-pink-900/30',
    
    // Border colors
    borderPrimary: isIsabelle ? 'border-purple-500' : 'border-pink-500',
    borderHover: isIsabelle ? 'hover:border-purple-300' : 'hover:border-pink-300',
    
    // Shadow colors
    shadowPrimary: isIsabelle ? 'shadow-purple-500/25' : 'shadow-pink-500/25',
    shadowPrimaryLight: isIsabelle ? 'shadow-purple-500/10' : 'shadow-pink-500/10',
    
    // Focus ring colors
    focusRing: isIsabelle ? 'focus:ring-purple-500' : 'focus:ring-pink-500',
    
    // CSS custom properties for inline styles
    cssGradient: isIsabelle 
      ? 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #6A1B9A 100%)'
      : 'linear-gradient(135deg, #E91E63 0%, #C2185B 50%, #AD1457 100%)',
    cssGradientLight: isIsabelle 
      ? 'linear-gradient(90deg, #9C27B0/20 0%, #7B1FA2/20 100%)'
      : 'linear-gradient(90deg, #E91E63/20 0%, #C2185B/20 100%)',
  };
}
