import { useEffect } from 'react'
import { Trophy, Crown, Flame, Zap, Sparkles, Star, X } from 'lucide-react'
import { UserBadge } from '../../services/api'
import Button from './Button'

interface BadgeUnlockModalProps {
  badge: UserBadge | null
  onClose: () => void
  onViewGallery?: () => void
}

export default function BadgeUnlockModal({ badge, onClose, onViewGallery }: BadgeUnlockModalProps) {
  useEffect(() => {
    if (!badge) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [badge, onClose])

  if (!badge) return null

  const getRarityConfig = (rarityStr?: string) => {
    const r = (rarityStr || '').toLowerCase()
    if (r.includes('legend') || r === '3') {
      return {
        label: 'Lendário',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        glowClass: 'from-amber-500/30 via-yellow-500/10 to-transparent',
        borderClass: 'border-amber-400/50 shadow-amber-500/20',
        iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-600',
        IconComp: Crown,
      }
    }
    if (r.includes('epic') || r === '2') {
      return {
        label: 'Épico',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
        glowClass: 'from-purple-500/30 via-fuchsia-500/10 to-transparent',
        borderClass: 'border-purple-400/50 shadow-purple-500/20',
        iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
        IconComp: Flame,
      }
    }
    if (r.includes('rare') || r === '1') {
      return {
        label: 'Raro',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
        glowClass: 'from-emerald-500/30 via-teal-500/10 to-transparent',
        borderClass: 'border-emerald-400/50 shadow-emerald-500/20',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        IconComp: Zap,
      }
    }
    return {
      label: 'Comum',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      glowClass: 'from-blue-500/30 via-indigo-500/10 to-transparent',
      borderClass: 'border-blue-400/50 shadow-blue-500/20',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      IconComp: Trophy,
    }
  }

  const rarity = getRarityConfig(badge.badgeRarity)
  const RarityIcon = rarity.IconComp

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md bg-slate-900 border ${rarity.borderClass} rounded-2xl p-6 sm:p-8 text-center shadow-2xl text-white overflow-hidden transform animate-in zoom-in-95 duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-b ${rarity.glowClass} blur-3xl pointer-events-none`}
        />

        {/* Floating sparkles */}
        <Sparkles className="w-5 h-5 text-amber-300 absolute top-5 left-6 animate-bounce" />
        <Star className="w-4 h-4 text-yellow-300 absolute top-7 right-10 animate-pulse" />
        <Sparkles className="w-4 h-4 text-blue-300 absolute bottom-7 left-8 animate-pulse" />
        <Star className="w-5 h-5 text-amber-400 absolute bottom-8 right-7 animate-bounce" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-yellow-300 mb-4 tracking-wider uppercase">
          <Trophy className="w-3.5 h-3.5" />
          <span>Nova Conquista Desbloqueada!</span>
        </div>

        {/* Badge Icon */}
        <div className="my-5 relative flex justify-center">
          <div
            className={`w-28 h-28 rounded-2xl ${rarity.iconBg} p-1 shadow-lg flex items-center justify-center ring-4 ring-white/10 relative transform hover:scale-105 transition-transform`}
          >
            {badge.badgeIconUrl && badge.badgeIconUrl.startsWith('http') ? (
              <img
                src={badge.badgeIconUrl}
                alt={badge.badgeName}
                className="w-20 h-20 object-contain drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <RarityIcon className="w-14 h-14 text-white" />
            )}
          </div>
        </div>

        {/* Badge Details */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-2xl font-extrabold text-white">{badge.badgeName}</h3>
          </div>
          <div className="flex justify-center">
            <span className={`px-3 py-0.5 text-xs font-bold rounded-full border ${rarity.badgeClass}`}>
              {rarity.label}
            </span>
          </div>
          <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed pt-1">
            {badge.badgeDescription || 'Você conquistou um novo marco importante no NextStep!'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          {onViewGallery && (
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() => {
                onClose()
                onViewGallery()
              }}
            >
              Ver na Galeria
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full sm:w-auto text-white border-white/20 hover:bg-white/10"
            onClick={onClose}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
