import { useId } from "react";
import type { OrganName } from "./anatomy-journey";

/** Lightweight vector organs share a palette but keep independent SVG IDs. */
export function OrganIllustration({ organ }: { organ: OrganName }) {
  const id = useId().replaceAll(":", "");
  const tissue = `url(#${id}-tissue)`;
  const tube = `url(#${id}-tube)`;
  return <svg className="organ-illustration" viewBox="0 0 500 580" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-tissue`} cx=".3" cy=".2" r=".85"><stop stopColor="#ffe1c3" /><stop offset=".35" stopColor="#eea68f" /><stop offset=".75" stopColor="#cd766c" /><stop offset="1" stopColor="#a8575c" /></radialGradient>
      <linearGradient id={`${id}-tube`} x1="100" y1="100" x2="350" y2="480" gradientUnits="userSpaceOnUse"><stop stopColor="#f9c8ae" /><stop offset=".48" stopColor="#e6a08c" /><stop offset="1" stopColor="#bf7270" /></linearGradient>
      <filter id={`${id}-shadow`} x="-40%" y="-30%" width="180%" height="170%"><feDropShadow dx="2" dy="18" stdDeviation="15" floodColor="#a65a42" floodOpacity=".16" /></filter>
    </defs>
    <g className="organ-float" filter={`url(#${id}-shadow)`}>
      {organ === "bouche" && <>
        <path d="M82 253c49-13 68-62 116-50 24 8 34 17 52 17s30-15 55-18c42-5 75 42 116 51-45 78-96 110-169 110S124 332 82 253Z" fill={tissue} stroke="#bc7871" strokeWidth="2" />
        <path d="M104 260c58-3 89-10 145-10s104 9 151 10c-39 53-85 72-148 72-67 0-112-29-148-72Z" fill="#a9565f" />
        <path d="M142 256v23q14 17 29 0v-25m0 0v30q16 16 32 0v-30m0 0v33q17 17 34 0v-34m0 0v35q17 15 34 0v-35m0 0v33q17 17 34 0v-33m0 0v28q16 16 32 0v-26m0 0v23q15 15 29 0v-23" fill="#fff9e9" stroke="#d8b4a3" strokeWidth="2" />
        <path d="M192 316q59-32 119 0-55 43-119 0Z" fill="#e89892" />
        <path d="M127 241q38-30 72-23m95 0q30-8 69 22M165 336q89 40 171-1" stroke="#ffd9be" strokeWidth="5" strokeLinecap="round" opacity=".7" />
        <path d="M250 365v121" stroke={tube} strokeWidth="30" strokeLinecap="round" opacity=".55" />
      </>}
      {organ === "oesophage" && <>
        <path d="M234 60c-45 56-6 112 1 164s-18 99-6 151 42 85 28 151" stroke="#bd7974" strokeWidth="66" strokeLinecap="round" />
        <path d="M227 60c-45 56-6 112 1 164s-18 99-6 151 42 85 28 151" stroke={tube} strokeWidth="54" strokeLinecap="round" />
        {Array.from({ length: 15 }, (_, i) => <path key={i} d={`M${201 + Math.sin(i * .7) * 12} ${90 + i * 28}q25 16 50 0`} stroke="#af6967" strokeOpacity=".3" strokeWidth="3" />)}
        <path d="M225 83c-25 43 8 105 9 147s-13 99-4 143 28 86 23 122" stroke="#ffe0be" strokeWidth="8" strokeLinecap="round" opacity=".6" />
        <circle className="swallow-particle" cx="232" cy="190" r="11" fill="#fff1ce" opacity=".8" />
        <path d="M315 190h51m-10-8 10 8-10 8M140 351H91m10-8-10 8 10 8" stroke="#ba7a69" strokeWidth="1.5" />
      </>}
      {organ === "estomac" && <>
        <path d="M208 40v111c0 43 24 61 22 93" stroke={tube} strokeWidth="35" strokeLinecap="round" />
        <path d="M225 211c29 10 27-71 85-65 88 9 119 89 100 168-20 85-79 132-141 121-46-8-61-57-100-46-22 7-27 40-9 66" stroke="#b9726d" strokeWidth="3" fill={tissue} />
        <path d="M294 179c62-1 107 71 87 145-13 49-54 90-94 78-29-9-42-42-72-40" stroke="#ffd4b0" strokeWidth="5" strokeLinecap="round" opacity=".65" />
        {[0,1,2,3,4].map(i => <path key={i} d={`M${292+i*14} ${204+i*9}c-35 42 13 51-17 91s-8 57-31 70`} stroke="#b76c65" strokeWidth="3" strokeLinecap="round" opacity=".42" />)}
        <path d="M160 455c-13 23 7 37 27 36" stroke={tube} strokeWidth="29" strokeLinecap="round" />
      </>}
      {organ === "intestin" && <>
        <path d="M185 82c-34 37 30 46 22 78" stroke={tube} strokeWidth="33" strokeLinecap="round" />
        <path d="M182 170c-79-18-102 44-38 63l187-30c65-10 90 52 27 65l-204 19c-68 6-61 65 5 64l174-21c65-8 78 54 16 66l-180 9c-57 3-48 57 10 58l104-5c48-2 65-20 65-53" stroke="#b7756c" strokeWidth="46" strokeLinecap="round" />
        <path d="M182 170c-79-18-102 44-38 63l187-30c65-10 90 52 27 65l-204 19c-68 6-61 65 5 64l174-21c65-8 78 54 16 66l-180 9c-57 3-48 57 10 58l104-5c48-2 65-20 65-53" stroke={tube} strokeWidth="36" strokeLinecap="round" />
        <path d="M203 189c44-24 88 1 57 44m-25 41c-26 28-9 46 15 61m-39 34c30 9 34 22 23 48" stroke="#f1b29a" strokeWidth="31" strokeLinecap="round" />
        <path d="m149 220 159-28m-151 83 176-19m-172 83 164-20m-148 75 142-9" stroke="#ffe0ba" strokeWidth="3" opacity=".5" strokeLinecap="round" />
      </>}
      {organ === "colon" && <>
        <path d="M124 402c-28-28-9-72-13-127-4-44-26-107 23-120 36-10 72 20 115 10 53-13 105-26 126 10 17 29-5 82 0 127 7 60 23 106-13 128-29 17-66-1-81 29-9 18-27 30-38 26v52" stroke="#b37472" strokeWidth="63" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M124 402c-28-28-9-72-13-127-4-44-26-107 23-120 36-10 72 20 115 10 53-13 105-26 126 10 17 29-5 82 0 127 7 60 23 106-13 128-29 17-66-1-81 29-9 18-27 30-38 26v52" stroke={tube} strokeWidth="52" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M124 402c-28-28-9-72-13-127-4-44-26-107 23-120 36-10 72 20 115 10 53-13 105-26 126 10 17 29-5 82 0 127 7 60 23 106-13 128-29 17-66-1-81 29-9 18-27 30-38 26" stroke="#a46565" strokeWidth="54" strokeDasharray="3 29" opacity=".3" />
        <path d="m119 423-8 27" stroke="#ba7f76" strokeWidth="12" strokeLinecap="round" />
        <path d="M176 236q65-32 130 0m-130 55q65-32 130 0m-130 55q65-32 130 0" stroke="#ddad8f" strokeWidth="19" strokeLinecap="round" opacity=".25" />
      </>}
    </g>
    <g fill="#c58e75" opacity=".3">{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={45 + i * 49 % 430} cy={75 + i * 83 % 440} r={2 + i % 3} />)}</g>
  </svg>;
}
