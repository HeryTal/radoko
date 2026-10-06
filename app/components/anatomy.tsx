export function Anatomy() {
  return (
    <svg className="anatomy" viewBox="0 0 640 760" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="organ" cx=".38" cy=".28" r=".8"><stop stopColor="#ffc5a6" /><stop offset=".3" stopColor="#e88c79" /><stop offset=".65" stopColor="#aa4e54" /><stop offset="1" stopColor="#4c223c" /></radialGradient>
        <linearGradient id="liver" x1="170" y1="230" x2="410" y2="360" gradientUnits="userSpaceOnUse"><stop stopColor="#df967e" /><stop offset=".4" stopColor="#a25556" /><stop offset="1" stopColor="#492338" /></linearGradient>
        <linearGradient id="tube" x1="240" y1="350" x2="410" y2="580" gradientUnits="userSpaceOnUse"><stop stopColor="#f9bda0" /><stop offset=".5" stopColor="#d98478" /><stop offset="1" stopColor="#86444f" /></linearGradient>
        <linearGradient id="body" x1="320" y1="0" x2="320" y2="760" gradientUnits="userSpaceOnUse"><stop stopColor="#e89b8d" stopOpacity="0" /><stop offset=".3" stopColor="#e89b8d" stopOpacity=".16" /><stop offset=".8" stopColor="#e89b8d" stopOpacity=".1" /><stop offset="1" stopColor="#e89b8d" stopOpacity="0" /></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="18" /></filter>
        <filter id="shadow" x="-40%" y="-30%" width="180%" height="170%"><feDropShadow dx="0" dy="12" stdDeviation="13" floodColor="#160e1b" floodOpacity=".8" /></filter>
      </defs>
      <ellipse cx="329" cy="365" rx="172" ry="235" fill="#d67667" opacity=".09" filter="url(#glow)" />
      <g stroke="url(#body)" strokeWidth="1.2">
        <path fill="url(#body)" fillOpacity=".25" d="M274-10c2 45-3 80-18 98-23 15-80 15-105 41-36 36-44 108-34 173l27 132c10 59-5 130 10 204l25 122h302l20-122c15-74 0-145 10-204l27-132c10-65 2-137-34-173-25-26-82-26-105-41-15-18-20-53-18-98" />
        <path d="M255 98c-33 29-55 74-46 120m190-120c33 29 55 74 46 120M160 153c-6 123 39 214 32 285s-11 140 9 227M497 153c6 123-39 214-32 285s11 140-9 227" />
        {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M320 ${158+i*23} Q254 ${131+i*25} 202 ${165+i*24} M337 ${158+i*23} Q403 ${131+i*25} 455 ${165+i*24}`} />)}
        <path d="M328 124v490M251 641q77 60 154 0" strokeDasharray="3 9" />
      </g>
      <g className="organ-system" filter="url(#shadow)">
        <path d="M329 21c-7 79-2 111 2 155 3 31 18 43 14 79" stroke="#733d49" strokeWidth="23" strokeLinecap="round" />
        <path d="M326 21c-7 79-2 111 2 155 3 31 18 43 14 79" stroke="url(#tube)" strokeWidth="15" strokeLinecap="round" />
        <path d="M329 267c19 8 17-40 42-43 44-5 67 36 56 72-13 43-48 70-80 67-34-2-55-30-40-51 10-15 35-11 39-24" fill="url(#organ)" stroke="#f8b19a" strokeOpacity=".38" />
        <path d="M384 240c28 8 34 33 21 57" stroke="#ffd0b1" strokeWidth="3" opacity=".32" strokeLinecap="round" />
        <path d="M173 260c25-33 107-41 166-14 17 8 35 17 24 30-18 21-52 17-78 28-31 13-39 43-75 35-33-7-56-48-37-79Z" fill="url(#liver)" stroke="#f4b199" strokeOpacity=".35" />
        <path d="M185 265c44-26 96-23 139-10" stroke="#ffcfad" strokeWidth="2" opacity=".27" strokeLinecap="round" />
        <path d="M272 308c-15 14-19 39-6 47 10 6 21-5 20-18l-4-23" fill="#99916a" stroke="#cbb998" strokeOpacity=".4" />
        <path d="M288 359q48-26 102-13c-6 23-36 23-54 18s-32 17-48 8Z" fill="#d49a7c" />
        <path d="M214 525c-21-17-10-52-10-86 0-33-15-63 12-73 24-9 38 9 66 8 26-1 48-13 76-8 25 4 47-9 61 11 15 22-7 44-2 77 5 35 25 64-2 81-19 12-33 3-44 17-14 18-18 29-39 26v50" stroke="#4e263b" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M214 525c-21-17-10-52-10-86 0-33-15-63 12-73 24-9 38 9 66 8 26-1 48-13 76-8 25 4 47-9 61 11 15 22-7 44-2 77 5 35 25 64-2 81-19 12-33 3-44 17-14 18-18 29-39 26v50" stroke="url(#tube)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M214 525c-21-17-10-52-10-86 0-33-15-63 12-73 24-9 38 9 66 8 26-1 48-13 76-8 25 4 47-9 61 11 15 22-7 44-2 77 5 35 25 64-2 81-19 12-33 3-44 17-14 18-18 29-39 26" stroke="#51243a" strokeWidth="34" strokeDasharray="2 20" opacity=".27" />
        <path d="M245 401c-20 17-8 35 14 34l98-13c29-4 34 25 7 30l-104 10c-29 3-27 28 1 29l95-9c29-3 36 23 8 29l-88 5c-28 2-25 28 3 28l44-1c33-1 41-13 39-29" stroke="#57293d" strokeWidth="26" strokeLinecap="round" />
        <path d="M245 401c-20 17-8 35 14 34l98-13c29-4 34 25 7 30l-104 10c-29 3-27 28 1 29l95-9c29-3 36 23 8 29l-88 5c-28 2-25 28 3 28l44-1c33-1 41-13 39-29" stroke="url(#tube)" strokeWidth="20" strokeLinecap="round" />
        <path d="M251 400c25-12 51 12 43 29m23 7c-10 12-11 24-2 36m-31 16c15 11 16 18 7 31" stroke="#efab92" strokeWidth="16" strokeLinecap="round" />
      </g>
      <g stroke="#eab19d" strokeOpacity=".42" strokeWidth=".8"><path d="M357 191h82l27-27h72" /><path d="M404 283h59l28 27h73" /><path d="M264 480H161l-26 26H75" /></g>
      <g fill="#f2c3ac"><circle cx="357" cy="191" r="3" /><circle cx="404" cy="283" r="3" /><circle cx="264" cy="480" r="3" /></g>
      <g className="anatomy-label" fill="#d9a79c" fontSize="10" letterSpacing="2"><text x="469" y="155">ŒSOPHAGE</text><text x="493" y="331">ESTOMAC</text><text x="75" y="527">INTESTIN</text></g>
      <g fill="#edb099" opacity=".5">{Array.from({length: 20}, (_, i) => <circle className="anatomy-particle" key={i} cx={85 + ((i * 127) % 480)} cy={30 + ((i * 97) % 680)} r={i % 3 === 0 ? 2 : 1} style={{ animationDelay: `${i * -.7}s` }} />)}</g>
    </svg>
  );
}
