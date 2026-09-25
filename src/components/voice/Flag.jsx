// Drapeaux en SVG : les émojis de drapeaux ne s'affichent pas sous Windows.
const flags = {
  sn: (
    <>
      <rect width="1" height="2" fill="#00853f" />
      <rect x="1" width="1" height="2" fill="#fdef42" />
      <rect x="2" width="1" height="2" fill="#e31b23" />
      <path d="M1.5 .68L1.576 .895L1.804 .901L1.624 1.04L1.688 1.259L1.5 1.13L1.312 1.259L1.376 1.04L1.196 .901L1.424 .895Z" fill="#00853f" />
    </>
  ),
  fr: (
    <>
      <rect width="1" height="2" fill="#002395" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ed2939" />
    </>
  ),
  gb: (
    <>
      <rect width="3" height="2" fill="#012169" />
      <path d="M0 0L3 2M3 0L0 2" stroke="#fff" strokeWidth=".4" />
      <path d="M0 0L3 2M3 0L0 2" stroke="#c8102e" strokeWidth=".13" />
      <path d="M1.5 0V2M0 1H3" stroke="#fff" strokeWidth=".6" />
      <path d="M1.5 0V2M0 1H3" stroke="#c8102e" strokeWidth=".36" />
    </>
  ),
}

// Pastille ronde : le drapeau 3:2 est recadré au centre.
function Flag({ code, className }) {
  return (
    <span className={className ? `flag ${className}` : 'flag'} aria-hidden="true">
      <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice">{flags[code]}</svg>
    </span>
  )
}

export default Flag
