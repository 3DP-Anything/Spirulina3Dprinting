import React, { useRef, useMemo, useState, useEffect, useLayoutEffect, useCallback, memo } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Grid,
  Center,
  Environment,
  Text,
  Billboard,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { jsPDF } from "jspdf";
import { ProjectLogoAnimated } from "./ProjectLogoAnimated";
import logoUrl from "../../Project-Logo1.svg";
import { STLLoader } from "three-stdlib";
import { ModelParams, PrinterSettings, ShapeType, TextureType } from "../lib/types";
import {
  getRoundedPolygonPoints,
  getModulatedRadius,
  getModulatedTwist,
  getLayerPoints,
  calculateModelVolume,
  generateSolidGeometry,
} from "../lib/geometry";
import { exportToSTL, exportTo3MF } from "../lib/export";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Rewind,
  FastForward,
  Box,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Info,
  FileDown,
  Grid3X3,
  Compass,
  Database,
  Maximize,
  MoveHorizontal,
  Image,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ANIM_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="150" height="150" viewBox="0.23 70.23 99.54 99.54" version="1.1">
  <defs>
    <linearGradient id="anim-linearGradient25">
      <stop stop-color="#d45500" stop-opacity="1" offset="0.62531644" />
      <stop stop-color="#d45500" stop-opacity="0" offset="1" />
    </linearGradient>
    <linearGradient id="anim-linearGradient17">
      <stop stop-color="#fff6d5" stop-opacity="0" offset="0" />
      <stop stop-color="#fff6d5" stop-opacity="1" offset="1" />
    </linearGradient>
    <radialGradient xlink:href="#anim-linearGradient17" id="anim-radialGradient19" cx="50.000004" cy="120" fx="50.000004" fy="120" r="50.015461" gradientUnits="userSpaceOnUse" />
    <linearGradient xlink:href="#anim-linearGradient25" id="anim-linearGradient26" x1="79.727005" y1="101.48844" x2="49.121155" y2="101.48844" gradientUnits="userSpaceOnUse" />
    <filter id="water-ripple-co2" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04 0.08" numOctaves="2" result="wave">
        <animate attributeName="baseFrequency" dur="12s" values="0.04 0.08; 0.04 0.095; 0.04 0.08" repeatCount="indefinite" />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="wave" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <style>
      @keyframes sway-seaweed-1 {
        0%, 100% { transform: rotate(0deg) skewX(0deg) scaleY(1) skewY(0deg); }
        50% { transform: rotate(5.5deg) skewX(4.5deg) scaleY(1.05) skewY(1.5deg); }
      }
      @keyframes sway-seaweed-2 {
        0%, 100% { transform: rotate(0deg) skewX(0deg) scaleY(1) skewY(0deg); }
        50% { transform: rotate(-5deg) skewX(-4deg) scaleY(0.95) skewY(-1.5deg); }
      }
      @keyframes co2-wave-C {
        0%, 100% { transform: translate(0px, 0px) skewX(0deg); }
        33% { transform: translate(0.5px, -0.8px) skewX(1deg); }
        66% { transform: translate(-0.5px, 0.5px) skewX(-0.5deg); }
      }
      @keyframes co2-wave-O {
        0%, 100% { transform: translate(0px, 0px) skewX(0deg); }
        33% { transform: translate(-0.6px, 0.4px) skewX(-0.5deg); }
        66% { transform: translate(0.6px, -0.6px) skewX(1.2deg); }
      }
      @keyframes co2-wave-2 {
        0%, 100% { transform: translate(0px, 0px) skewX(0deg); }
        33% { transform: translate(0.8px, 0.3px) skewX(0.8deg); }
        66% { transform: translate(-0.4px, -0.9px) skewX(-1.2deg); }
      }
      .seaweed-deep {
        animation: sway-seaweed-1 3.2s ease-in-out infinite;
        transform-origin: 50px 165px;
      }
      .seaweed-light {
        animation: sway-seaweed-2 3.8s ease-in-out infinite;
        transform-origin: 50px 165px;
      }
      .co2-c {
        animation: co2-wave-C 3s ease-in-out infinite;
        transform-origin: 24px 88px;
        filter: url(#water-ripple-co2);
      }
      .co2-o {
        animation: co2-wave-O 3.4s ease-in-out infinite;
        transform-origin: 63px 84px;
        filter: url(#water-ripple-co2);
      }
      .co2-2 {
        animation: co2-wave-2 2.7s ease-in-out infinite;
        transform-origin: 81px 114px;
        filter: url(#water-ripple-co2);
      }
    </style>
  </defs>
  <g id="layer1">
    <circle style="fill:url(#anim-radialGradient19);fill-opacity:1;stroke:#2d5016;stroke-width:1;stroke-dasharray:none;stroke-opacity:1" id="path16" cx="50.000004" cy="120" r="49.765461" />
    <path id="path13-5" class="seaweed-deep" style="fill:#2d5016;fill-opacity:1;stroke:none;stroke-width:0.5;stroke-dasharray:none;stroke-opacity:1" d="m 37.832833,73.657003 c 0,0 5.001749,8.324105 6.444051,14.344344 1.020702,-1.16914 1.758221,-2.350167 1.850533,-3.620968 0.317859,-4.37578 -1.425311,-6.758581 -3.127416,-8.380381 -1.702105,-1.6218 -5.167168,-2.342995 -5.167168,-2.342995 z m 6.444051,14.344344 c -2.493907,2.856588 -6.684773,5.145919 -7.276883,8.99865 -0.376043,2.446832 0.07794,5.524763 0.830765,8.032353 0.0012,-0.0408 0.0021,-0.0615 0.0021,-0.0615 0,0 6.657007,-8.261692 6.82594,-13.967102 0.02608,-0.880865 -0.118554,-1.903227 -0.381889,-3.002401 z m -6.446118,17.031003 c -0.02437,0.85741 -1.266693,10.89583 0.169235,14.96765 1.504222,4.26548 4.386401,4.59635 7.006554,8.49655 0.772579,1.15001 1.958854,2.57817 3.247864,4.09742 -0.722105,-3.03088 -1.551045,-6.05483 -2.247925,-8.09718 -1.635947,-4.79447 -3.385855,-6.52139 -4.999695,-10.99984 -0.886565,-2.46024 -2.258322,-5.4078 -3.176033,-8.4646 z m 10.423653,27.56162 c 0.963349,4.04345 1.736499,8.09901 1.751831,9.85057 -3.7e-5,0.0174 3.25e-4,0.0347 5.17e-4,0.0522 3.96e-4,0.036 10e-4,0.0718 0.0021,0.10697 0.0749,2.54952 1.809823,2.73952 3.214791,2.05879 0.970128,-0.23423 1.782837,-0.95625 1.782837,-2.16576 0,-1.39464 0.663321,-3.34201 1.619539,-5.70301 -1.192171,0.56892 -2.462203,1.08843 -3.567741,1.69292 -1.333728,-1.85135 -3.152972,-3.94692 -4.803841,-5.89267 z m 8.371582,4.19975 c 1.340051,-0.6395 2.581888,-1.34172 3.380672,-2.29702 2.62798,-3.14291 5.517519,-1.98546 6.993329,-5.4967 1.428345,-3.39829 0.979428,-8.17401 0.09926,-12.11153 -0.912185,2.40078 -2.227496,4.6762 -3.092835,6.60838 -1.6164,3.6092 -4.363844,6.13717 -5.999634,9.99991 -0.495126,1.16919 -0.965731,2.27212 -1.380794,3.29696 z m 10.473263,-19.90525 c 0.79172,-2.08372 2.273248,-4.75877 1.900738,-6.88847 -0.586003,-3.3503 -5.95617,-5.17059 -8.386648,-7.64604 -0.401762,1.14423 -0.637768,2.22362 -0.606681,3.14296 0.16237,4.80182 5.99222,6.95586 7.00009,10.99985 0.03242,0.13009 0.06325,0.26083 0.0925,0.3917 z m -6.48591,-14.53451 c 1.696684,-4.83221 6.351551,-10.823113 6.351551,-10.823113 0,0 -3.801094,1.028592 -4.958354,1.965772 -2.08805,1.69096 -3.301257,2.23321 -2.999817,6.00015 0.0811,1.013461 0.712046,1.946061 1.60662,2.85719 z" />
    <path id="text13-8" class="co2-c" style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:32.6005px;line-height:0;font-family:sans-serif;fill:#d45500;fill-opacity:1;stroke:none;stroke-width:0.5;stroke-dasharray:none;stroke-opacity:1" d="m 24.421875,88.863281 c -4.383879,0.04766 -8.900514,2.502566 -10.648287,6.642978 -1.67699,3.665712 -1.734917,7.938071 -0.677885,11.784761 0.975368,3.48252 3.679364,6.49013 7.182083,7.53311 4.32897,1.41788 9.106391,0.58024 13.097161,-1.45353 0.737486,-0.10235 0.974204,-0.90863 0.787162,-1.54638 0.03925,-1.4053 0.0072,-2.81968 0.01758,-4.22852 -1.005683,-0.21607 -2.097185,0.0746 -2.763742,0.88012 -2.381412,1.87074 -5.744597,2.70322 -8.619071,1.90699 -1.63614,-0.36835 -3.167953,-1.64457 -3.933417,-3.21851 -1.260767,-2.47193 -1.299259,-5.41471 -0.72088,-8.080316 0.527231,-2.282328 2.100578,-4.457018 4.447568,-5.082127 3.28238,-0.996647 6.862849,0.22515 9.409854,2.379002 0.581197,0.690739 1.903767,0.608308 2.21875,-0.294921 0.01465,-1.073559 -0.08641,-2.176327 -0.04174,-3.264838 -0.133697,-0.513684 0.301982,-1.376238 -0.261391,-1.625895 -2.9165,-1.506428 -6.185556,-2.487182 -9.493745,-2.331924 z" />
    <path id="text13-7-0" class="co2-o" style="font-size:43.7476px;fill:url(#anim-linearGradient26);fill-opacity:1;stroke:none;stroke-width:0.5;stroke-dasharray:none;stroke-opacity:1" d="m 63.583986,84.410153 c -4.241904,0.146206 -8.603446,1.935939 -11.117878,5.471157 -3.048889,4.13587 -3.686257,9.5351 -3.196575,14.52494 0.427211,4.42505 2.36377,8.93775 6.103089,11.53827 3.835859,2.69514 8.877672,3.16144 13.362177,2.14662 4.192434,-0.9553 7.77201,-4.06281 9.378988,-8.04148 1.770383,-4.18621 1.958832,-8.91463 1.167763,-13.348565 C 78.519371,92.70564 76.417264,88.777558 72.851195,86.635809 70.095442,84.9158 66.802919,84.26713 63.583986,84.410153 Z m 0.847657,4.693359 c 2.348045,-0.05736 4.885422,0.802365 6.476562,2.423828 1.791248,1.699251 2.74328,4.205042 3.091797,6.472657 0.480348,3.503053 0.406224,7.226973 -1.025391,10.513673 -1.240657,2.84372 -4.000255,4.99072 -7.118521,5.27167 -3.022144,0.39887 -6.344468,-0.44521 -8.384502,-2.81868 -2.517901,-2.80981 -2.987533,-6.7987 -2.871195,-10.42429 0.107334,-3.232729 0.908668,-6.693739 3.313672,-9.01503 0.728672,-0.722285 1.80891,-1.435813 2.871093,-1.816406 1.164425,-0.431495 2.408399,-0.605317 3.646485,-0.607422 z" />
    <path id="text13-7-8-6" class="co2-2" style="font-style:normal;font-variant:normal;font-weight:bold;font-stretch:normal;font-size:19.6486px;font-family:sans-serif;fill:#d45500;fill-opacity:1;stroke:none;stroke-width:0.5;stroke-dasharray:none;stroke-opacity:1" d="m 81.138672,114.92578 c -1.548695,0.10036 -3.084905,0.44768 -4.519531,1.04102 0,1.35547 0,2.71093 0,4.0664 0.596535,0.0448 1.172081,0.032 1.632254,-0.40027 1.238777,-0.69042 2.855954,-1.28767 4.207589,-0.57629 1.042414,0.77918 0.469969,2.31454 -0.230858,3.13002 -1.685721,2.05066 -3.885904,3.59003 -5.982032,5.18834 0,1.05143 0,2.10286 0,3.1543 4.091146,0 8.182291,0 12.273437,0 0,-1.26433 0,-2.52865 0,-3.79297 -1.785807,0 -3.571614,0 -5.357422,0 2.018903,-1.62622 4.279554,-3.53162 4.650391,-6.26172 0.285752,-1.85911 -0.519769,-3.93128 -2.271602,-4.77924 -1.33381,-0.72256 -2.914422,-0.8333 -4.402226,-0.76959 z" />
    <path id="path13-65-61-static-bed" style="fill:#408b0e;fill-opacity:1;stroke:none;stroke-width:0.5;stroke-dasharray:none;stroke-opacity:1" d="M 54.086619,133.72362 c -0.629604,1.07035 -1.19181,1.98638 -1.580265,2.66082 -0.0065,0.0113 -0.01265,0.0224 -0.01912,0.0336 -0.355527,-0.59385 -0.726251,-1.19528 -1.096058,-1.79627 -0.57142,2.79037 -1.256726,5.36848 -1.368908,7.34167 -0.0149,0.17609 -0.02,0.35361 -0.0155,0.5333 v 7.00009 h 0.04961 c -0.03253,0.16147 -0.04961,0.32837 -0.04961,0.49971 0,1.385 1.114587,2.5001 2.499589,2.5001 H 70.00658 v 1.99988 H 33.506999 c -1.385002,0 -2.500106,1.11511 -2.500106,2.50011 0,1.385 1.115104,2.5001 2.500106,2.5001 h 38.902535 0.09715 0.08527 c 1.337726,0 2.414861,-1.07711 2.41484,-2.41484 v -0.0791 c 5e-6,-0.002 0,-0.004 0,-0.006 0,-0.002 5e-6,-0.004 0,-0.006 v -7.07916 c -2.1e-5,-1.33772 -1.077114,-2.41432 -2.41484,-2.41432 h -0.08527 -17.500223 v -5.00021 c 0,-0.23747 -0.03191,-0.49085 -0.07906,-0.75189 -0.09428,-2.14509 -0.589502,-5.06215 -0.840776,-8.02122 z" />
    <path id="path13-65-61" class="seaweed-light" style="fill:#408b0e;fill-opacity:1;stroke:none;stroke-width:0.5;stroke-dasharray:none;stroke-opacity:1" d="m 54.651444,73.386735 c 0,0 -2.069683,6.396033 -1.651443,11.613263 0.180635,2.253241 2.193454,6.107399 3,8.999999 1.078054,-3.782251 2.147649,-8.0961 2.006794,-10.503285 C 57.86594,81.089527 54.651444,73.386735 54.651444,73.386735 Z m 1.348557,20.613262 c -2,4 -1.994153,6.049983 -2,8.000003 -0.0129,4.3022 1,6 1,6 0,0 1.011584,2.73471 1.976366,5.58635 0.59709,-2.79119 2.069491,-5.39453 2.023634,-8.58635 -0.04693,-3.26783 -1.939042,-7.194978 -3,-11.000003 z m 0.976366,19.586353 c -0.47894,2.23888 -1.034033,4.27492 -1.454691,5.9893 -0.9451,3.85168 -1.262771,6.38606 -1.521871,10.42417 -0.07412,1.15525 -0.02332,2.42685 0.08682,3.7238 1.812267,-3.08092 5.509357,-6.14472 5.913376,-9.72362 0.278514,-2.46714 -2.012949,-7.42635 -3.02363,-10.41365 z m -2.889746,20.13727 z m -2.695443,0.89814 c 0.60607,-2.95958 1.084308,-6.15772 0.615467,-9.12503 -0.43512,-2.7539 -0.580096,-4.89661 -2.006644,-8.49673 -0.624834,-1.57687 -2.597675,-3.1252 -3.442119,-5.29209 -0.672242,2.50253 -1.074154,5.33294 -0.551388,7.78867 0.856719,4.0245 1.000334,7.00036 3.000334,11.00036 0.651696,1.3034 1.515532,2.71286 2.38435,4.12482 z m -4.833296,-22.91385 c 0.42944,-1.59866 0.969142,-3.06337 1.44849,-4.21111 1.229715,-2.94441 3.744453,-2.76704 4.000273,-6.00015 0.119014,-1.504077 -0.798266,-3.317993 -1.785421,-5.140258 -1.932121,2.06946 -4.730103,4.123758 -5.214669,7.140138 -0.393587,2.45003 0.46784,5.4311 1.551327,8.21138 z m 3.663342,-15.351518 c 0.86036,-0.921515 1.549223,-1.846011 1.785421,-2.859773 0.76663,-3.29038 -1.081071,-8.663037 -1.081071,-8.663037 0,0 -2.6435,2.56096 -2.919202,5.66322 -0.147443,1.65906 1.080047,3.764768 2.214852,5.85959 z" />
  </g>
</svg>
`;

const CU_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100.4px" height="96.9px" viewBox="106.3 8.1 100.4 96.9" version="1.1" id="svg1" xml:space="preserve"><defs id="defs1"><style id="style1">.cls-1{fill:#225500;}.cls-2{fill:#fff;}</style></defs><g id="layer1"><g id="g26" transform="matrix(0.5675137,0,0,0.5675137,44.56993,-62.968814)"><rect class="cls-1" x="109.35948" y="212.49049" width="176.2072" height="82.677002" id="rect1" style="fill:#225500;stroke-width:0.264583" /><path class="cls-2" d="m 270.04359,238.62074 c -0.9525,0.58209 -4.6355,0.61648 -6.85535,0.61648 v -8.38729 c 0,-1.49754 0,-3.0824 0.12435,-4.65137 0,-0.79375 -0.21167,-1.19857 -1.6219,-1.19857 h -1.69068 c 0.1217,2.02671 0.20902,3.96875 0.20902,5.90286 v 4.33387 c 0,1.53459 0,3.06652 -0.12171,4.6355 0,0.61648 0,1.19856 1.49754,1.19856 h 7.40833 a 1.27,1.27 0 0 0 1.07421,-1.16416 c 0,0 -0.0238,-0.40481 -0.0238,-1.28588 z m -38.18467,-5.46364 h -1.76212 a 17.089437,17.089437 0 0 1 0.21166,3.52425 v 2.36273 a 9.6440624,9.6440624 0 0 1 -3.41841,0.54504 5.9213749,5.9213749 0 0 1 -6.21771,-5.60652 5.7335208,5.7335208 0 0 1 0.0159,-0.8255 c 0,-3.68036 2.11667,-6.57225 5.99017,-6.57225 a 8.8106249,8.8106249 0 0 1 5.29167,2.23837 l 0.49212,-1.41023 a 1.0715625,1.0715625 0 0 0 -0.54504,-1.40758 11.980333,11.980333 0 0 0 -5.29167,-1.07685 c -5.29166,0 -9.30275,2.52147 -9.30275,8.22854 0,5.70706 4.01638,8.20208 9.1784,8.20208 a 26.363083,26.363083 0 0 0 6.68073,-1.15358 v -5.86582 a 1.1800417,1.1800417 0 0 0 -1.1721,-1.19062 1.3890625,1.3890625 0 0 0 -0.15082,0.008 z m 15.71625,19.64796 h -2.64583 a 3.0585833,3.0585833 0 0 1 -0.20902,1.32291 c -0.54769,1.10861 -1.19856,2.27277 -1.76213,3.38138 -0.56356,1.1086 -1.99231,3.38402 -2.64583,4.42383 -1.60337,-2.60879 -2.97921,-5.29167 -4.42383,-7.98248 a 2.0928541,2.0928541 0 0 0 -2.06111,-1.12712 h -3.29141 c 2.76754,3.96875 4.91595,7.55914 7.22577,11.4882 0,2.27278 0,5.29167 -0.15875,7.61207 a 1.0768542,1.0768542 0 0 0 1.00806,1.13771 1.0265833,1.0265833 0 0 0 0.31221,-0.0291 h 2.94481 c -0.35454,-2.87073 -0.35454,-6.20183 -0.35454,-8.96673 1.905,-3.43958 4.08781,-6.61458 6.45054,-10.08062 a 0.96837499,0.96837499 0 0 0 0.21167,-0.70379 0.56091666,0.56091666 0 0 0 -0.57944,-0.54769 h -0.037 z m -42.17458,-24.10355 a 2.413,2.413 0 0 1 2.54,-2.2807 h 0.0847 a 4.1936458,4.1936458 0 0 1 3.53483,1.98966 4.5296666,4.5296666 0 0 0 0.86254,-1.99231 c 0,-1.35467 -3.10092,-1.76213 -4.14073,-1.76213 -2.76489,0 -5.49804,1.53459 -5.49804,4.54819 0,5.29167 7.52475,3.87615 7.52475,7.40834 a 2.6458333,2.6458333 0 0 1 -2.54265,2.74108 a 3.0532916,3.0532916 0 0 1 -0.3466,0 5.7361666,5.7361666 0 0 1 -4.6646,-2.30188 10.149417,10.149417 0 0 0 -0.42334,1.9394 1.4472708,1.4472708 0 0 0 0.86254,1.44462 7.4321457,7.4321457 0 0 0 3.38403,0.77523 c 3.19087,0 6.23887,-1.76212 6.23887,-5.29166 0.082,-5.03502 -7.41627,-3.50044 -7.41627,-7.21784 z m -6.48494,-3.75443 h -2.14048 a 12.980458,12.980458 0 0 1 -1.76212,3.683 c -0.91546,1.44462 -1.76213,2.88925 -2.23838,3.52425 -1.28587,-2.06111 -2.51883,-4.17777 -3.75179,-6.23888 a 1.7594791,1.7594791 0 0 0 -1.76212,-0.89694 h -2.64584 c 2.23838,3.06388 4.29948,6.20184 6.2918,9.42711 v 1.76212 c 0,1.47902 -0.12436,3.10092 -0.12436,3.96875 a 0.89958332,0.89958332 0 0 0 0.94986,0.84402 a 0.93927082,0.93927082 0 0 0 0.12435,-0.0159 h 2.18546 a 64.672103,64.672103 0 0 1 -0.24606,-6.94267 64.219666,64.219666 0 0 1 3.8047,-5.7441 c 0.54769,-0.82815 1.16417,-1.6219 1.76213,-2.39713 a 1.2012083,1.2012083 0 0 0 0.21166,-0.54504 a 0.48947916,0.48947916 0 0 0 -0.52916,-0.44714 a 0.43391666,0.43391666 0 0 0 -0.11906,0.0185 z m -18.36208,0.0873 h -9.09902 a 24.545396,24.545396 0 0 0 0.21167,2.52148 v 5.91873 c 0,2.76754 -0.12436,4.24656 -0.12436,6.39762 a 1.0583333,1.0583333 0 0 0 0.92869,1.17211 a 1.0821458,1.0821458 0 0 0 0.30692,0 h 1.98966 c -0.0344,-1.85209 -0.21166,-3.66448 -0.21166,-5.53244 v -2.11667 a 35.538833,35.538833 0 0 1 6.35,0.42334 c 0,-0.74084 0.21166,-2.15107 -0.91546,-2.15107 -1.12713,0 -3.25967,0.24871 -5.461,0.24871 v -5.22552 a 25.235958,25.235958 0 0 1 6.81831,0.58208 c 0.15875,-0.82814 0.40481,-2.21985 -0.79375,-2.21985 z m -16.8275,7.18873 c 0,-3.175 0.15875,-3.92906 0.15875,-5.90286 a 1.143,1.143 0 0 0 -0.89165,-1.34937 a 1.1138958,1.1138958 0 0 0 -0.42862,0 h -1.905 a 67.688353,67.688353 0 0 1 0.24871,7.43479 c 0,3.96875 -0.15875,4.84717 -0.15875,7.27869 a 1.1641667,1.1641667 0 0 0 0.98954,1.32291 a 1.2435417,1.2435417 0 0 0 0.24342,0 h 1.98966 c -0.15875,-1.81504 -0.24606,-4.49791 -0.24606,-8.7577 z m 12.58094,33.25019 a 14.456833,14.456833 0 0 1 -6.23623,0.82814 c -0.61648,0 -0.70644,-0.36777 -0.74084,-1.1086 v -5.78115 a 21.973646,21.973646 0 0 1 6.08542,0.58208 v -1.28587 c 0,-0.86254 -0.46037,-1.19856 -1.65629,-1.19856 -1.19592,0 -2.85485,0.21166 -4.54819,0.21166 v -6.14891 c 4.82865,0 6.04573,0.40481 6.731,0.70379 v -0.93398 a 1.5875,1.5875 0 0 0 -1.39171,-1.61925 h -9.1387 a 5.8816874,5.8816874 0 0 1 0.45772,2.6961 v 8.80005 q 0,2.61143 -0.12435,5.29166 c 0,0.91811 0.15875,1.44463 1.11125,1.44463 h 7.85283 a 1.3043958,1.3043958 0 0 0 1.60338,-1.16152 z m -27.54842,-15.94644 a 22.248812,22.248812 0 0 0 -9.76842,-2.27277 c -11.08339,0 -18.43087,8.93498 -18.43087,19.84375 0,10.58333 8.05127,17.44398 18.35944,17.44398 a 19.372791,19.372791 0 0 0 10.78441,-3.10092 l -0.42333,-3.52425 a 13.123333,13.123333 0 0 1 -8.26294,3.52425 c -9.12812,0 -15.20825,-7.55915 -15.20825,-16.36977 0,-7.52211 4.29948,-14.95954 12.56506,-14.95954 a 11.625792,11.625792 0 0 1 7.64646,2.67758 a 7.4533124,7.4533124 0 0 1 2.39713,3.89467 a 11.176,11.176 0 0 0 2.11666,-4.7625 a 2.9104166,2.9104166 0 0 0 -1.77535,-2.39448 z m 97.89583,-24.66711 c -5.29166,0 -8.81062,2.81782 -8.81062,8.22855 0,5.09058 3.96875,8.17562 8.81062,8.17562 4.84188,0 8.95086,-3.048 8.95086,-8.10683 0,-5.05884 -4.0005,-8.29734 -8.96938,-8.29734 z m 0,14.74788 c -3.71739,0 -5.58535,-3.13796 -5.58535,-6.53786 0,-3.39989 1.86796,-6.57225 5.58535,-6.57225 3.7174,0 5.60388,3.13532 5.60388,6.65957 0,3.73591 -1.35731,6.46906 -5.6224,6.46906 z m 15.85913,10.14942 h -8.95879 a 4.3682708,4.3682708 0 0 1 0.65087,2.0955 c 0.21167,2.73314 0.33602,5.37633 0.33602,8.14122 h -8.59896 a 4.8418749,4.8418749 0 0 1 0.6694,2.11667 c 0.24606,2.94481 0.33602,5.70971 0.33602,8.636 0,3.75179 0,7.55915 -0.24871,11.32946 a 1.0265833,1.0265833 0 0 0 1.05834,0.99219 h 0.0767 6.69396 c 7.22577,0 12.59946,-3.89467 12.96459,-11.15484 a 10.924646,10.924646 0 0 0 7.61206,-11.08339 c 0.0529,-7.91104 -5.07471,-11.04636 -12.43542,-11.04636 z m 4.91596,19.71675 c -0.58209,-5.61975 -4.08782,-8.3873 -9.18105,-9.18105 0,-3.10091 0.12436,-5.79702 0.24607,-8.63335 a 15.962312,15.962312 0 0 1 2.43152,-0.21167 c 5.95577,0 10.08062,3.52425 10.08062,9.67317 a 9.7340207,9.7340207 0 0 1 -3.50573,8.37142 z m -5.00327,1.41022 h -2.81517 a 0.98689582,0.98689582 0 0 1 -1.10331,-0.8546 v -0.0979 c -0.15611,-2.48443 -0.29898,-4.95035 -0.29898,-7.18872 a 8.8053332,8.8053332 0 0 1 5.29166,8.10683 z m -7.54857,10.28965 h -2.79135 a 1.000125,1.000125 0 0 1 -1.15094,-0.82815 c 0,-0.0291 0,-0.0582 0,-0.0873 -0.15875,-2.7305 -0.24606,-5.29166 -0.24606,-7.98248 0,-3.41841 0,-7.0485 0.28046,-10.31875 a 15.594541,15.594541 0 0 1 2.43152,-0.17727 11.318875,11.318875 0 0 1 1.19856,0 q 0,5.02709 -0.24606,10.05417 a 1.0027708,1.0027708 0 0 0 1.05833,0.95514 h 8.04069 c -0.38629,4.86305 -3.02948,8.42169 -8.49313,8.4216 z m -39.79333,-31.31079 h -10.87173 c 0.61648,0.86254 0.86254,2.51883 1.03981,5.86846 0.12171,2.43152 0.21167,4.91596 0.21167,7.40833 q 0,4.52967 -0.12435,9.05669 c 0,1.65629 -0.21167,3.25966 -0.21167,4.91596 a 1.2356042,1.2356042 0 0 0 1.25942,1.2065 h 0.11377 8.26558 c 9.18104,0 16.03375,-5.09323 16.03375,-14.71348 0,-9.62025 -6.50081,-13.74246 -15.71625,-13.74246 z m 0,26.07733 h -3.52425 a 1.2117917,1.2117917 0 0 1 -1.397,-1.00277 c 0,-0.0344 0,-0.0714 0,-0.10583 -0.12435,-0.82815 -0.17727,-2.02671 -0.21167,-2.88925 0,-1.86796 -0.12171,-4.6355 -0.12171,-6.94267 0,-4.26508 0.20903,-8.51164 0.36778,-12.72381 a 18.621375,18.621375 0 0 1 3.13795,-0.28046 c 7.366,0 12.43542,4.17513 12.43542,11.90625 0.0688,6.81831 -3.24379,12.03325 -10.55687,12.03325 z m -22.20383,-8.73125 a 9.8345624,9.8345624 0 0 0 7.50887,-9.39271 c 0,-5.95577 -5.29166,-8.14123 -10.58333,-8.14123 -3.34963,0 -6.731,0 -10.13354,0.12436 a 8.4243332,8.4243332 0 0 1 0.59266,3.27025 v 10.66006 c 0,7.89517 -0.37041,12.43542 -0.37041,13.93825 0,0.61648 0.24606,0.70379 0.77523,0.70379 h 5.29166 a 3.2305625,3.2305625 0 0 1 -0.54504,-1.56633 a 64.537166,64.537166 0 0 1 -0.54769,-8.636 h 3.51896 c 1.46315,2.30981 3.27819,5.00592 5.29167,7.73642 c 3.11944,4.08781 7.34748,8.81062 12.33487,8.81062 a 36.462229,36.462229 0 0 0 3.78884,-0.45773 c -5.79702,-2.00819 -13.32177,-11.82423 -16.79311,-17.03916 z m -5.16202,-1.16416 h -2.88975 v -4.93978 c 0,-2.9792 0,-6.35 0.24606,-9.26041 0.86519,0 1.86796,-0.17463 2.82046,-0.17463 4.20952,0 7.59354,2.23838 7.59354,6.78392 a 7.3845207,7.3845207 0 0 1 -7.16227,7.59619 c -0.16669,0 -0.33602,0 -0.50271,0 z m -37.40944,-31.86378 a 4.9847499,4.9847499 0 0 0 4.0005,-4.71222 c 0,-3.43959 -3.01361,-4.42384 -5.86581,-4.42384 h -5.78115 a 2.3627291,2.3627291 0 0 1 0.37042,1.07421 c 0.12435,1.76213 0,4.49792 0,6.731 v 7.06702 a 0.97102082,0.97102082 0 0 0 0.87312,1.05833 a 1.0583333,1.0583333 0 0 0 0.29104,-0.0159 h 2.11667 a 46.370874,46.370874 0 0 1 -0.30162,-6.23888 h 1.76212 a 56.620833,56.620833 0 0 0 3.73592,5.70971 a 5.1276249,5.1276249 0 0 0 4.6355,2.30717 h 0.79375 a 50.821166,50.821166 0 0 1 -6.63046,-8.55663 z m -3.52425,-0.86518 h -0.89694 v -6.87917 h 1.41023 a 3.683,3.683 0 0 1 4.06665,3.25438 c 0,0.09 0.0159,0.17991 0.0212,0.26458 c 0.0873,2.62731 -2.32568,3.41842 -4.58258,3.3655 z m -14.09436,-8.20209 h -5.83406 a 8.5460416,8.5460416 0 0 1 0.37042,2.88925 v 11.73692 a 1.127125,1.127125 0 0 0 0.91546,1.3044 a 1.2964583,1.2964583 0 0 0 0.24871,0.0159 h 1.98966 c -0.17462,-1.93939 -0.21166,-4.17512 -0.21166,-6.23887 h 1.48166 c 3.25967,0 6.81831,-1.56634 6.81831,-5.29167 -0.0873,-3.41842 -2.94216,-4.37092 -5.79702,-4.42383 z m -1.32291,8.3873 h -1.28588 v -6.94267 h 1.60338 c 2.11666,0 3.71739,0.82814 3.71739,3.175 a 3.6644791,3.6644791 0 0 1 -3.556,3.77825 a 3.46075,3.46075 0 0 1 -0.49741,-0.0185 z m 34.00954,40.18491 -8.59896,-19.61091 a 1.42875,1.42875 0 0 0 -1.41023,-1.23561 h -0.52916 l -9.91923,21.1455 a 1.9552708,1.9552708 0 0 0 -0.24871,0.9869 c 0,0.36777 0.45773,0.45773 0.79375,0.50006 h 0.0238 2.18546 a 1.7224375,1.7224375 0 0 1 0,-0.49477 a 3.6406666,3.6406666 0 0 1 0.24606,-1.23296 l 2.11667,-5.12762 h 8.46666 l 2.30717,5.7441 a 1.3917083,1.3917083 0 0 0 1.39171,1.09273 h 4.21217 a 4.9741666,4.9741666 0 0 1 -1.03717,-1.76742 z m -14.50181,-7.0485 3.52425,-8.35289 3.37608,8.35289 z m -16.77663,-12.56502 a 9.855729,9.855729 0 0 0 7.40833,-9.4271 c 0,-5.95577 -5.29167,-8.14123 -10.58333,-8.14123 -3.34698,0 -6.731,0 -10.1309,0.12435 a 8.5222291,8.5222291 0 0 1 0.57944,3.25967 v 10.66006 c 0,7.89517 -0.36777,12.43542 -0.36777,13.93825 c 0,0.61648 0.24606,0.70379 0.79375,0.70379 h 5.29166 a 3.2808333,3.2808333 0 0 1 -0.37041,-1.53193 a 64.965791,64.965791 0 0 1 -0.55827,-8.63336 h 3.52425 c 1.46314,2.30717 3.27554,5.00327 5.29166,7.73377 c 3.1168,4.08782 7.34748,8.81063 12.33488,8.81063 a 36.107687,36.107687 0 0 0 3.66448,-0.24606 c -5.79702,-2.13255 -13.32177,-11.96446 -16.79311,-17.16352 z" />
<path class="cls-1" d="m 226.79538,135.96241 -9.05879,9.14122 a 4.14073,4.14073 0 0 1 0.65087,2.11667 c 0.21431,2.7305 0.33602,5.34988 0.33602,8.08248 h -8.5143 a 4.548187,4.548187 0 0 1 0.65088,2.11667 c 0.24606,2.94481 0.33602,5.70971 0.33602,8.636 v 11.32946 a 1.0583333,1.0583333 0 0 0 1.05833,0.99219 h 6.69396 c 7.22577,0 12.59946,-3.89467 12.96459,-11.15484 a 10.924646,10.924646 0 0 0 7.61206,-11.08339 c 0.0529,-7.91104 -5.07471,-11.04636 -12.43542,-11.04636 z m 4.91596,19.71675 c -0.58209,-5.61975 -4.08782,-8.3873 -9.18105,-9.18105 v -8.63335 a 15.962312,15.962312 0 0 1 2.43152,-0.21167 c 5.95577,0 10.08062,3.52425 10.08062,9.67317 a 9.7340207,9.7340207 0 0 1 -3.50573,8.37142 z m -5.00327,1.41022 h -2.81517 a 0.98689582,0.98689582 0 0 1 -1.10331,-0.8546 v -0.0979 c -0.15611,-2.48443 -0.29898,-4.95035 -0.29898,-7.18872 a 8.8053332,8.8053332 0 0 1 5.29166,8.10683 z m -7.54857,10.28965 h -2.79135 a 1.000125,1.000125 0 0 1 -1.15094,-0.82815 c 0,-0.0291 0,-0.0582 0,-0.0873 -0.15875,-2.7305 -0.24606,-5.29166 -0.24606,-7.98248 q 0,-5.15891 0.28046,-10.31875 a 15.594541,15.594541 0 0 1 2.43152,-0.17727 11.318875,11.318875 0 0 1 1.19856,0 q 0,5.02709 -0.24606,10.05417 a 1.0027708,1.0027708 0 0 0 1.05833,0.95514 h 8.04069 c -0.38629,4.86305 -3.02948,8.42169 -8.49313,8.42169 z" /></g></g></svg>`;

const ExtrudedModel = memo(function ExtrudedModel({
  params,
  settings,
  transparent = false,
  wireframe = false,
}: {
  params: ModelParams;
  settings: PrinterSettings;
  transparent?: boolean;
  wireframe?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    return generateHollowGeometry(params, settings);
  }, [params, settings]);

  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      if (wireframe) {
        const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 6);
        materialRef.current.emissive.set("#10B981");
        materialRef.current.emissiveIntensity = pulse * 1.5;
        materialRef.current.opacity =
          0.5 + 0.4 * Math.sin(state.clock.elapsedTime * 6);
      } else {
        materialRef.current.emissive.setHex(0);
        materialRef.current.emissiveIntensity = 0;
        materialRef.current.opacity = transparent ? 0.2 : 1;
      }
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} name="extruded-model">
        <meshStandardMaterial
          ref={materialRef}
          color={wireframe ? "#10B981" : params.color}
          roughness={0.4}
          metalness={0.2}
          side={THREE.DoubleSide}
          transparent={transparent || wireframe}
          opacity={wireframe ? 0.8 : transparent ? 0.2 : 1}
          depthWrite={!transparent && !wireframe}
          wireframe={wireframe}
          flatShading={false}
        />
      </mesh>
    </group>
  );
});

function PathRenderer({
  points,
  progress,
  totalDistance,
  cumulativeDistances,
  viewMode = "path",
  color = "#6366F1",
  layerHeight = 0.2,
  nozzleSize = 0.4,
  extrudingSegments = [],
  highlightedSection = null,
}: {
  points: THREE.Vector3[];
  progress: number;
  totalDistance: number;
  cumulativeDistances: number[];
  viewMode?: "path" | "material";
  color?: string;
  layerHeight?: number;
  nozzleSize?: number;
  extrudingSegments?: boolean[];
  highlightedSection?: string | null;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const instancedJointMeshRef = useRef<THREE.InstancedMesh>(null);
  const lineMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const instancedMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const jointMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const isHighlighted =
    highlightedSection === "subsec_3d_path_hover" ||
    highlightedSection === "subsec-3d-path";

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const instancedMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.6,
      metalness: 0.1,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    (instancedMaterialRef as any).current = mat;
    return mat;
  }, [color]);

  const jointMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.6,
      metalness: 0.1,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    (jointMaterialRef as any).current = mat;
    return mat;
  }, [color]);

  const materialGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = nozzleSize;
    const h = layerHeight;
    const r = h / 2;
    const actualR = Math.min(r, w / 2);

    shape.moveTo(-w / 2 + actualR, -h / 2);
    shape.lineTo(w / 2 - actualR, -h / 2);
    shape.absarc(w / 2 - actualR, 0, actualR, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-w / 2 + actualR, h / 2);
    shape.absarc(
      -w / 2 + actualR,
      0,
      actualR,
      Math.PI / 2,
      (3 * Math.PI) / 2,
      false,
    );
    shape.lineTo(-w / 2 + actualR, -h / 2);

    const geom = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 1,
      bevelEnabled: false,
    });
    geom.translate(0, 0, -0.5);
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, [nozzleSize, layerHeight]);

  // Joint cap geometry placed at vertices to fill direction-change gaps seamlessly
  const jointGeometry = useMemo(() => {
    const w = nozzleSize;
    const h = layerHeight;
    const r = h / 2;
    const actualR = Math.min(r, w / 2);
    const flatRadius = Math.max(0, w / 2 - actualR);

    // Profile ordered from bottom to top without duplicate endpoints
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, -h / 2));

    const arcSteps = 12;
    for (let a = 0; a <= arcSteps; a++) {
      const theta = -Math.PI / 2 + (a / arcSteps) * Math.PI;
      const rx = flatRadius + actualR * Math.cos(theta);
      const ry = actualR * Math.sin(theta);
      pts.push(new THREE.Vector2(Math.max(0, rx), ry));
    }

    pts.push(new THREE.Vector2(0, h / 2));

    const geom = new THREE.LatheGeometry(pts, 24);
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, [nozzleSize, layerHeight]);

  const nozzleGeometry = useMemo(() => {
    const pts = [
      new THREE.Vector2(1.0, 4), // Top inner (radius 1mm = 2mm hole)
      new THREE.Vector2(1.0, -4), // Bottom inner
      new THREE.Vector2(1.2, -4), // Bottom outer
      new THREE.Vector2(3.0, 4), // Top outer
      new THREE.Vector2(1.0, 4), // Close loop
    ];
    return new THREE.LatheGeometry(pts, 16);
  }, []);

  const currentIndex = useMemo(() => {
    if (!points.length || !cumulativeDistances.length || totalDistance === 0)
      return 0;
    const progressVal = isNaN(progress)
      ? 0
      : Math.max(0, Math.min(1, progress));
    const targetDist = progressVal * totalDistance;

    let low = 0;
    let high = cumulativeDistances.length - 1;
    let index = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (cumulativeDistances[mid] <= targetDist) {
        index = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return index;
  }, [cumulativeDistances, totalDistance, progress, points.length]);

  const setupInstancedMesh = useCallback(
    (meshInput?: THREE.InstancedMesh | null, jointMeshInput?: THREE.InstancedMesh | null) => {
      const mesh = meshInput || instancedMeshRef.current;
      const jointMesh = jointMeshInput || instancedJointMeshRef.current;
      if (!mesh || points.length <= 1) return;

      // Always disable frustum culling to prevent false culling during playback
      mesh.frustumCulled = false;
      mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(125, 125, 50), 500);

      const maxCount = Math.max(1, points.length);

      // Pre-allocate instanceColor attribute to the full capacity so it never truncates to 0
      if (!mesh.instanceColor || mesh.instanceColor.count < maxCount) {
        mesh.instanceColor = new THREE.InstancedBufferAttribute(
          new Float32Array(maxCount * 3),
          3
        );
      }

      const w = nozzleSize;
      const matrix = new THREE.Matrix4();
      const direction = new THREE.Vector3();
      const position = new THREE.Vector3();
      const nozzleColor = new THREE.Color(color);
      const rapidColor = new THREE.Color("#94A3B8");
      const worldUp = new THREE.Vector3(0, 0, 1);

      const prevDir = new THREE.Vector3();
      const nextDir = new THREE.Vector3();

      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        const isExtruding = extrudingSegments[i];

        direction.subVectors(end, start);
        const len = direction.length();
        if (len < 0.001) {
          matrix.identity().scale(new THREE.Vector3(0, 0, 0));
          mesh.setMatrixAt(i, matrix);
          mesh.setColorAt(i, rapidColor);
          continue;
        }

        const forward = direction.clone().normalize();

        // Find true previous and next extruding segments (skipping zero-length or comment lines)
        let prevForward: THREE.Vector3 | null = null;
        for (let p = i - 1; p >= 0; p--) {
          if (extrudingSegments[p] && points[p].distanceTo(points[p + 1]) > 0.001) {
            if (points[p + 1].distanceTo(start) < 0.25) {
              prevForward = new THREE.Vector3().subVectors(points[p + 1], points[p]).normalize();
            }
            break;
          }
        }

        let nextForward: THREE.Vector3 | null = null;
        for (let n = i + 1; n < points.length - 1; n++) {
          if (extrudingSegments[n] && points[n].distanceTo(points[n + 1]) > 0.001) {
            if (points[n].distanceTo(end) < 0.25) {
              nextForward = new THREE.Vector3().subVectors(points[n + 1], points[n]).normalize();
            }
            break;
          }
        }

        let extStart = 0;
        let extEnd = 0;

        if (isExtruding) {
          if (prevForward) {
            const dotStart = Math.max(-1, Math.min(1, prevForward.dot(forward)));
            if (dotStart < 0.999 && dotStart > -0.999) {
              const halfAngle = Math.acos(dotStart) / 2;
              extStart = Math.min(w * 1.25, (w / 2) * Math.tan(halfAngle));
            }
          }

          if (nextForward) {
            const dotEnd = Math.max(-1, Math.min(1, forward.dot(nextForward)));
            if (dotEnd < 0.999 && dotEnd > -0.999) {
              const halfAngle = Math.acos(dotEnd) / 2;
              extEnd = Math.min(w * 1.25, (w / 2) * Math.tan(halfAngle));
            }
          }
        }

        const effLen = len + extStart + extEnd + (isExtruding ? 0.04 : 0);

        position.addVectors(start, end).multiplyScalar(0.5);
        if (extEnd !== extStart) {
          position.addScaledVector(forward, (extEnd - extStart) * 0.5);
        }

        const localY = forward; // The direction of travel

        let localX = new THREE.Vector3();
        if (Math.abs(forward.dot(worldUp)) > 0.99) {
          localX.set(1, 0, 0);
        } else {
          localX.crossVectors(localY, worldUp).normalize();
        }

        const localZ = new THREE.Vector3()
          .crossVectors(localX, localY)
          .normalize();

        matrix.makeBasis(localX, localY, localZ);
        matrix.setPosition(position);

        const scaleFactor = isExtruding ? 1.0 : 0.05;
        const scaleMatrix = new THREE.Matrix4().makeScale(
          scaleFactor,
          effLen,
          scaleFactor,
        );
        matrix.multiply(scaleMatrix);

        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, isExtruding ? nozzleColor : rapidColor);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => (m.needsUpdate = true));
        } else {
          mesh.material.needsUpdate = true;
        }
      }

      mesh.userData.pointsRef = points;
      mesh.userData.colorRef = color;
      mesh.userData.layerHeightRef = layerHeight;
      mesh.userData.nozzleSizeRef = nozzleSize;
      mesh.userData.extrudeRef = extrudingSegments;
      mesh.userData.initialized = true;

      // Configure joint mesh at vertices to fill direction-change gaps seamlessly
      if (jointMesh) {
        jointMesh.frustumCulled = false;
        jointMesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(125, 125, 50), 500);

        if (!jointMesh.instanceColor || jointMesh.instanceColor.count < maxCount) {
          jointMesh.instanceColor = new THREE.InstancedBufferAttribute(
            new Float32Array(maxCount * 3),
            3
          );
        }

        const jointMatrix = new THREE.Matrix4();
        const jointScale = new THREE.Matrix4().makeScale(1.06, 1.06, 1.02); // slightly expanded in XY and Z to bridge seamlessly

        // Precompute which vertices are endpoints of an extruding segment
        const isExtrudingAtVertex = new Uint8Array(points.length);
        for (let s = 0; s < points.length - 1; s++) {
          if (extrudingSegments[s] && points[s].distanceTo(points[s + 1]) > 0.001) {
            isExtrudingAtVertex[s] = 1;
            isExtrudingAtVertex[s + 1] = 1;
          }
        }

        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          if (isExtrudingAtVertex[i] === 1) {
            jointMatrix.identity();
            jointMatrix.setPosition(pt);
            jointMatrix.multiply(jointScale);
            jointMesh.setMatrixAt(i, jointMatrix);
            jointMesh.setColorAt(i, nozzleColor);
          } else {
            jointMatrix.identity().scale(new THREE.Vector3(0, 0, 0));
            jointMesh.setMatrixAt(i, jointMatrix);
            jointMesh.setColorAt(i, rapidColor);
          }
        }
        jointMesh.instanceMatrix.needsUpdate = true;
        if (jointMesh.instanceColor) jointMesh.instanceColor.needsUpdate = true;

        if (jointMesh.material) {
          if (Array.isArray(jointMesh.material)) {
            jointMesh.material.forEach((m) => (m.needsUpdate = true));
          } else {
            jointMesh.material.needsUpdate = true;
          }
        }
        jointMesh.userData.initialized = true;
      }
    },
    [points, color, layerHeight, nozzleSize, extrudingSegments]
  );

  useLayoutEffect(() => {
    if (viewMode === "material") {
      if (instancedMeshRef.current) {
        instancedMeshRef.current.frustumCulled = false;
        instancedMeshRef.current.count = Math.max(0, Math.min(points.length - 1, currentIndex));
      }
      if (instancedJointMeshRef.current) {
        instancedJointMeshRef.current.frustumCulled = false;
        instancedJointMeshRef.current.count = Math.max(0, Math.min(points.length, currentIndex + 1));
      }
      setupInstancedMesh(instancedMeshRef.current, instancedJointMeshRef.current);
    }
  }, [setupInstancedMesh, viewMode, points, currentIndex]);

  useEffect(() => {
    if (viewMode === "material") {
      if (instancedMeshRef.current) {
        instancedMeshRef.current.frustumCulled = false;
        instancedMeshRef.current.count = Math.max(0, Math.min(points.length - 1, currentIndex));
      }
      if (instancedJointMeshRef.current) {
        instancedJointMeshRef.current.frustumCulled = false;
        instancedJointMeshRef.current.count = Math.max(0, Math.min(points.length, currentIndex + 1));
      }
      setupInstancedMesh(instancedMeshRef.current, instancedJointMeshRef.current);
    }
  }, [setupInstancedMesh, viewMode, points, currentIndex]);

  useEffect(() => {
    if (viewMode === "path" && lineRef.current) {
      lineRef.current.geometry.setDrawRange(0, currentIndex + 1);
    } else if (viewMode === "material") {
      if (instancedMeshRef.current) {
        instancedMeshRef.current.frustumCulled = false;
        instancedMeshRef.current.count = Math.max(0, Math.min(points.length - 1, currentIndex));
      }
      if (instancedJointMeshRef.current) {
        instancedJointMeshRef.current.frustumCulled = false;
        instancedJointMeshRef.current.count = Math.max(0, Math.min(points.length, currentIndex + 1));
      }
    }
  }, [currentIndex, viewMode, points.length]);

  useFrame((state, delta) => {
    if (viewMode === "material" && points.length > 1) {
      const mesh = instancedMeshRef.current;
      const jMesh = instancedJointMeshRef.current;
      if (mesh) {
        mesh.frustumCulled = false;
        if (
          !mesh.userData.initialized ||
          (jMesh && !jMesh.userData.initialized) ||
          mesh.userData.pointsRef !== points ||
          mesh.userData.colorRef !== color ||
          mesh.userData.layerHeightRef !== layerHeight ||
          mesh.userData.nozzleSizeRef !== nozzleSize ||
          mesh.userData.extrudeRef !== extrudingSegments
        ) {
          setupInstancedMesh(mesh, jMesh);
        }
        mesh.count = Math.max(0, Math.min(points.length - 1, currentIndex));
      }
      if (jMesh) {
        jMesh.frustumCulled = false;
        jMesh.count = Math.max(0, Math.min(points.length, currentIndex + 1));
      }
    } else if (viewMode === "path" && lineRef.current) {
      lineRef.current.geometry.setDrawRange(0, currentIndex + 1);
    }

    if (lineMaterialRef.current) {
      if (isHighlighted) {
        lineMaterialRef.current.opacity =
          0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 8);
        lineMaterialRef.current.transparent = true;
      } else {
        lineMaterialRef.current.opacity = 1;
        lineMaterialRef.current.transparent = false;
      }
    }

    if (instancedMaterialRef.current) {
      if (isHighlighted) {
        const pulse = 0.6 + 0.6 * Math.sin(state.clock.elapsedTime * 8);
        instancedMaterialRef.current.emissive.set(color);
        instancedMaterialRef.current.emissiveIntensity = pulse;
      } else {
        instancedMaterialRef.current.emissive.setHex(0);
        instancedMaterialRef.current.emissiveIntensity = 0;
      }
    }

    if (jointMaterialRef.current) {
      if (isHighlighted) {
        const pulse = 0.6 + 0.6 * Math.sin(state.clock.elapsedTime * 8);
        jointMaterialRef.current.emissive.set(color);
        jointMaterialRef.current.emissiveIntensity = pulse;
      } else {
        jointMaterialRef.current.emissive.setHex(0);
        jointMaterialRef.current.emissiveIntensity = 0;
      }
    }

    if (groupRef.current) {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.scale.set(1, 1, 1);
      groupRef.current.visible = true;
    }
  });

  const bgGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const nozzlePos = useMemo(() => {
    if (!points.length || totalDistance === 0)
      return new THREE.Vector3(0, 0, 0);
    const progressVal = isNaN(progress)
      ? 0
      : Math.max(0, Math.min(1, progress));
    const targetDist = progressVal * totalDistance;

    // Find the segment we are currently in
    let low = 0;
    let high = cumulativeDistances.length - 2;
    let idx = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (cumulativeDistances[mid] <= targetDist) {
        idx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const p1 = points[idx];
    const p2 = points[idx + 1];

    if (!p2) return p1 ? p1.clone() : new THREE.Vector3(0, 0, 0);

    const d1 = cumulativeDistances[idx];
    const d2 = cumulativeDistances[idx + 1];
    const segmentLen = d2 - d1;

    if (segmentLen <= 0.0001) return p1.clone();

    const alpha = (targetDist - d1) / segmentLen;
    return new THREE.Vector3().lerpVectors(p1, p2, alpha);
  }, [points, progress, totalDistance, cumulativeDistances]);

  if (!points.length || totalDistance === 0) return null;

  return (
    <group position={[-125, -125, 0]}>
      {/* Primary Path and Nozzle Group with Glitch Physics */}
      <group ref={groupRef}>
        {/* Raycast Helper representing full un-rewinded path for comfortable hovering */}
        {/* @ts-ignore */}
        <line geometry={bgGeometry} name="gcode-path-raycast-helper">
          <lineBasicMaterial
            color="#000000"
            opacity={0}
            transparent={true}
            depthWrite={false}
          />
        </line>

        {/* Background Path */}
        {/* @ts-ignore */}
        <line geometry={bgGeometry}>
          <lineBasicMaterial
            color={isHighlighted ? "#F43F5E" : "#94A3B8"}
            opacity={isHighlighted ? 0.5 : viewMode === "path" ? 0.15 : 0.05}
            transparent
          />
        </line>

        {viewMode === "path" ? (
          /* @ts-ignore */
          <line ref={lineRef} geometry={geometry} name="gcode-path-line">
            <lineBasicMaterial
              ref={lineMaterialRef}
              color={color}
              linewidth={2}
            />
          </line>
        ) : (
          <>
            <instancedMesh
              key={`gcode-instanced-mesh-${points.length}-${viewMode}`}
              ref={(mesh: THREE.InstancedMesh | null) => {
                (instancedMeshRef as any).current = mesh;
                if (mesh && viewMode === "material") {
                  mesh.frustumCulled = false;
                  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(125, 125, 50), 500);
                  setupInstancedMesh(mesh, instancedJointMeshRef.current);
                  mesh.count = Math.max(0, Math.min(points.length - 1, currentIndex));
                }
              }}
              frustumCulled={false}
              args={[materialGeometry, undefined, Math.max(1, points.length)]}
              name="gcode-path-mesh"
            >
              <meshStandardMaterial
                ref={(mat: THREE.MeshStandardMaterial | null) => {
                  (instancedMaterialRef as any).current = mat;
                  if (mat) {
                    mat.needsUpdate = true;
                    if (instancedMeshRef.current) {
                      instancedMeshRef.current.material = mat;
                    }
                    setupInstancedMesh(instancedMeshRef.current, instancedJointMeshRef.current);
                  }
                }}
                color={color}
                roughness={0.6}
                metalness={0.1}
                depthWrite={true}
              />
            </instancedMesh>

            <instancedMesh
              key={`gcode-joint-mesh-${points.length}-${viewMode}`}
              ref={(mesh: THREE.InstancedMesh | null) => {
                (instancedJointMeshRef as any).current = mesh;
                if (mesh && viewMode === "material") {
                  mesh.frustumCulled = false;
                  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(125, 125, 50), 500);
                  setupInstancedMesh(instancedMeshRef.current, mesh);
                  mesh.count = Math.max(0, Math.min(points.length, currentIndex + 1));
                }
              }}
              frustumCulled={false}
              args={[jointGeometry, undefined, Math.max(1, points.length)]}
              name="gcode-path-joint-mesh"
            >
              <meshStandardMaterial
                ref={(mat: THREE.MeshStandardMaterial | null) => {
                  (jointMaterialRef as any).current = mat;
                  if (mat) {
                    mat.needsUpdate = true;
                    if (instancedJointMeshRef.current) {
                      instancedJointMeshRef.current.material = mat;
                    }
                    setupInstancedMesh(instancedMeshRef.current, instancedJointMeshRef.current);
                  }
                }}
                color={color}
                roughness={0.6}
                metalness={0.1}
                side={THREE.DoubleSide}
                depthWrite={true}
              />
            </instancedMesh>
          </>
        )}

        {/* Nozzle Assembly */}
        <group position={nozzlePos}>
          {/* Nozzle Tip (Truncated Cone with 2mm Hole) */}
          <mesh
            position={[0, 0, 4]}
            rotation={[Math.PI / 2, 0, 0]}
            geometry={nozzleGeometry}
          >
            <meshStandardMaterial
              color="#94A3B8"
              metalness={0.8}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function PrinterVolume({
  params,
  volume,
  showGrid,
  showBasePlate,
  showDimensions,
  showVolume,
  showBuildVolume,
  mode,
  highlightedSection,
}: {
  params: ModelParams;
  volume: number;
  showGrid: boolean;
  showBasePlate: boolean;
  showDimensions: boolean;
  showVolume: boolean;
  showBuildVolume: boolean;
  mode: "model" | "gcode";
  highlightedSection?: string | null;
}) {
  const diameter = Math.round(params.radius * 2);
  const height = Math.round(params.height);

  const volumeGeometry = useMemo(
    () => new THREE.BoxGeometry(251, 251, 260),
    [],
  );

  const roundedBedGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const size = 250;
    const radius = 5;
    const x = -size / 2;
    const y = -size / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + size - radius, y);
    shape.quadraticCurveTo(x + size, y, x + size, y + radius);
    shape.lineTo(x + size, y + size - radius);
    shape.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
    shape.lineTo(x + radius, y + size);
    shape.quadraticCurveTo(x, y + size, x, y + size - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    const extrudeSettings = {
      depth: 5,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  const isBaseHighlighted =
    highlightedSection === "subsec_3d_printer_base_hover" ||
    highlightedSection === "subsec-3d-printer-base";
  const isVolumeHighlighted =
    highlightedSection === "subsec_3d_build_volume_hover" ||
    highlightedSection === "subsec-3d-build-volume";

  return (
    <group name="printer-volume-group">
      {/* Bed Base */}
      <mesh 
        name="printer-baseplate"
        visible={showBasePlate}
        position={[0, 0, -5.02]} 
        geometry={roundedBedGeometry}
      >
        <meshStandardMaterial
          color={isBaseHighlighted ? "#10B981" : "#E2E8F0"}
          roughness={isBaseHighlighted ? 0.2 : 0.7}
          metalness={isBaseHighlighted ? 0.8 : 0.1}
          transparent={true}
          opacity={isBaseHighlighted ? 1.0 : 0.8}
        />
      </mesh>

      {/* Volume Outline */}
      <lineSegments
        name="printer-build-volume"
        visible={showBuildVolume}
        position={[0, 0, 130]}
        scale={isVolumeHighlighted ? [1.02, 1.02, 1.02] : [1, 1, 1]}
      >
        <edgesGeometry args={[volumeGeometry]} />
        <lineBasicMaterial
          color={isVolumeHighlighted ? "#F59E0B" : "#6366F1"}
          transparent
          opacity={isVolumeHighlighted ? 0.95 : 0.3}
        />
      </lineSegments>
    </group>
  );
}

const GCODE_EXPLANATIONS: Record<string, string> = {
  G0: "Move the nozzle quickly without printing",
  G1: "Move in a straight line while printing",
  G2: "Move in a smooth clockwise curve",
  G3: "Move in a smooth counter-clockwise curve",
  G4: "Wait for a short moment",
  G10: "Pull the material back slightly",
  G11: "Push the material back forward",
  G28: "Go back to the home corner",
  G29: "Check if the print bed is level",
  G90: "Use the machine coordinate",
  G91: "Move by a distance from the current position",
  G92: "Set the current spot as the new zero",
  M104: "Start warming up the nozzle",
  M109: "Wait until the nozzle is nice and hot",
  M140: "Start warming up the print bed",
  M190: "Wait until the print bed is nice and warm",
  M106: "Turn the cooling fan on",
  M107: "Turn the cooling fan off",
  M82: "Use exact material measurements",
  M83: "Measure material from where we are",
};

function SyncMiniCamera({
  miniCameraRef,
  targetZ,
  params,
}: {
  miniCameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  targetZ: number;
  params: ModelParams;
}) {
  useFrame(({ camera }) => {
    if (miniCameraRef.current) {
      const target = new THREE.Vector3(0, 0, targetZ);
      const dir = new THREE.Vector3().subVectors(camera.position, target);
      dir.normalize();

      const miniCenter = new THREE.Vector3(0, 0, targetZ);
      const fixedDistance =
        Math.max(params.radius * 3.5, params.height * 1.8) + 30;
      const newPos = new THREE.Vector3()
        .copy(dir)
        .multiplyScalar(fixedDistance)
        .add(miniCenter);

      miniCameraRef.current.position.copy(newPos);
      miniCameraRef.current.up.copy(camera.up);
      miniCameraRef.current.lookAt(miniCenter);
    }
  });
  return null;
}

interface Line3D {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

// Möller-Trumbore Ray-Triangle intersection using raw primitive math for optimal speed and zero GC allocations
function rayTriangleIntersectOptimizedMath(
  originX: number, originY: number, originZ: number,
  dirX: number, dirY: number, dirZ: number,
  v0x: number, v0y: number, v0z: number,
  v1x: number, v1y: number, v1z: number,
  v2x: number, v2y: number, v2z: number,
  epsilon = 1e-6
): number | null {
  const edge1x = v1x - v0x;
  const edge1y = v1y - v0y;
  const edge1z = v1z - v0z;

  const edge2x = v2x - v0x;
  const edge2y = v2y - v0y;
  const edge2z = v2z - v0z;

  const hx = dirY * edge2z - dirZ * edge2y;
  const hy = dirZ * edge2x - dirX * edge2z;
  const hz = dirX * edge2y - dirY * edge2x;

  const a = edge1x * hx + edge1y * hy + edge1z * hz;
  if (a > -epsilon && a < epsilon) return null;

  const f = 1.0 / a;
  const sx = originX - v0x;
  const sy = originY - v0y;
  const sz = originZ - v0z;

  const u = f * (sx * hx + sy * hy + sz * hz);
  if (u < 0.0 || u > 1.0) return null;

  const qx = sy * edge1z - sz * edge1y;
  const qy = sz * edge1x - sx * edge1z;
  const qz = sx * edge1y - sy * edge1x;

  const v = f * (dirX * qx + dirY * qy + dirZ * qz);
  if (v < 0.0 || u + v > 1.0) return null;

  const t = f * (edge2x * qx + edge2y * qy + edge2z * qz);
  return t > epsilon ? t : null;
}

const getMeshTriangles = (mesh: THREE.Mesh): THREE.Triangle[] => {
  const triangles: THREE.Triangle[] = [];
  const geometry = mesh.geometry;
  const positionAttribute = geometry.attributes.position;
  if (!positionAttribute) return triangles;

  const index = geometry.index;
  const matrix = mesh.matrixWorld;

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const idx0 = index.getX(i);
      const idx1 = index.getX(i + 1);
      const idx2 = index.getX(i + 2);

      const v0 = new THREE.Vector3().fromBufferAttribute(positionAttribute, idx0).applyMatrix4(matrix);
      const v1 = new THREE.Vector3().fromBufferAttribute(positionAttribute, idx1).applyMatrix4(matrix);
      const v2 = new THREE.Vector3().fromBufferAttribute(positionAttribute, idx2).applyMatrix4(matrix);

      triangles.push(new THREE.Triangle(v0, v1, v2));
    }
  } else {
    for (let i = 0; i < positionAttribute.count; i += 3) {
      const v0 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i).applyMatrix4(matrix);
      const v1 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 1).applyMatrix4(matrix);
      const v2 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 2).applyMatrix4(matrix);

      triangles.push(new THREE.Triangle(v0, v1, v2));
    }
  }
  return triangles;
};

const getWorldEdges = (mesh: THREE.Mesh): Line3D[] => {
  const edges: Line3D[] = [];
  const geometry = mesh.geometry;
  const edgesGeometry = new THREE.EdgesGeometry(geometry, 4);
  const posAttr = edgesGeometry.attributes.position;
  if (!posAttr) return edges;

  const matrix = mesh.matrixWorld;
  for (let i = 0; i < posAttr.count; i += 2) {
    const start = new THREE.Vector3().fromBufferAttribute(posAttr, i).applyMatrix4(matrix);
    const end = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1).applyMatrix4(matrix);
    edges.push({ start, end });
  }
  edgesGeometry.dispose();
  return edges;
};

const getViewEdges = (mesh: THREE.Mesh, view: 'top' | 'front'): Line3D[] => {
  const edges: Line3D[] = [];
  const triangles = getMeshTriangles(mesh);
  if (triangles.length === 0) return [];

  const getVertexKey = (v: THREE.Vector3): string => {
    const x = Math.round(v.x * 1000);
    const y = Math.round(v.y * 1000);
    const z = Math.round(v.z * 1000);
    return `${x},${y},${z}`;
  };

  const getEdgeKey = (va: THREE.Vector3, vb: THREE.Vector3): string => {
    const kA = getVertexKey(va);
    const kB = getVertexKey(vb);
    return kA < kB ? `${kA}|${kB}` : `${kB}|${kA}`;
  };

  interface EdgeData {
    start: THREE.Vector3;
    end: THREE.Vector3;
    normals: THREE.Vector3[];
  }

  const edgeMap = new Map<string, EdgeData>();

  triangles.forEach(tri => {
    const normal = new THREE.Vector3();
    tri.getNormal(normal).normalize();

    const addEdge = (va: THREE.Vector3, vb: THREE.Vector3) => {
      const key = getEdgeKey(va, vb);
      let data = edgeMap.get(key);
      if (!data) {
        data = { start: va, end: vb, normals: [] };
        edgeMap.set(key, data);
      }
      if (!data.normals.some(n => n.dot(normal) > 0.999)) {
        data.normals.push(normal);
      }
    };

    addEdge(tri.a, tri.b);
    addEdge(tri.b, tri.c);
    addEdge(tri.c, tri.a);
  });

  const V = view === 'top' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const cosThreshold = Math.cos(24 * Math.PI / 180); // 24 degrees threshold for defining sharp edges (corners)

  edgeMap.forEach(data => {
    if (data.normals.length === 1) {
      edges.push({ start: data.start, end: data.end });
    } else if (data.normals.length >= 2) {
      const n1 = data.normals[0];
      const n2 = data.normals[1];

      // 1. Sharp Feature check (corners/joints)
      const cosAngle = n1.dot(n2);
      if (cosAngle < cosThreshold) {
        edges.push({ start: data.start, end: data.end });
        return;
      }

      // 2. Silhouette outline check.
      // Silhouette edges occur when one face turns away from the camera and the other faces it.
      const d1 = n1.dot(V);
      const d2 = n2.dot(V);
      const eps = 1e-4;
      if (d1 * d2 < -eps) {
        edges.push({ start: data.start, end: data.end });
      }
    }
  });

  return edges;
};

function computeVisibleLineSegments(
  edges: Line3D[],
  triangles: THREE.Triangle[],
  view: 'top' | 'front',
  targetZ: number
): Line3D[] {
  const visibleSegments: Line3D[] = [];
  
  // Adaptively scale down quality for extremely dense inputs to prevent crashes and ensure great performance
  let segmentsCount = 8;
  let evaluatedEdges = edges;
  if (edges.length > 1500) {
    segmentsCount = 3;
    const edgesWithLength = edges.map(e => ({
      edge: e,
      lenSq: e.start.distanceToSquared(e.end)
    }));
    edgesWithLength.sort((a, b) => b.lenSq - a.lenSq);
    evaluatedEdges = edgesWithLength.slice(0, 1500).map(item => item.edge);
  } else if (edges.length > 600) {
    segmentsCount = 5;
  }

  let evaluatedTriangles = triangles;
  if (triangles.length > 2000) {
    const trianglesWithArea = triangles.map(tri => {
      const edge1 = new THREE.Vector3().subVectors(tri.b, tri.a);
      const edge2 = new THREE.Vector3().subVectors(tri.c, tri.a);
      const area = 0.5 * new THREE.Vector3().crossVectors(edge1, edge2).length();
      return { tri, area };
    });
    trianglesWithArea.sort((a, b) => b.area - a.area);
    evaluatedTriangles = trianglesWithArea.slice(0, 2000).map(item => item.tri);
  }

  const rx = view === 'top' ? 0 : 0;
  const ry = view === 'top' ? 0 : 1;
  const rz = view === 'top' ? -1 : 0;

  // Precompute triangle bounding boxes and flat coordinate values to avoid millions of property access calls
  const precomputedTriangles = evaluatedTriangles.map(tri => ({
    v0x: tri.a.x, v0y: tri.a.y, v0z: tri.a.z,
    v1x: tri.b.x, v1y: tri.b.y, v1z: tri.b.z,
    v2x: tri.c.x, v2y: tri.c.y, v2z: tri.c.z,
    minX: Math.min(tri.a.x, tri.b.x, tri.c.x),
    maxX: Math.max(tri.a.x, tri.b.x, tri.c.x),
    minY: Math.min(tri.a.y, tri.b.y, tri.c.y),
    maxY: Math.max(tri.a.y, tri.b.y, tri.c.y),
    minZ: Math.min(tri.a.z, tri.b.z, tri.c.z),
    maxZ: Math.max(tri.a.z, tri.b.z, tri.c.z),
  }));

  evaluatedEdges.forEach(edge => {
    const Ax = edge.start.x, Ay = edge.start.y, Az = edge.start.z;
    const Bx = edge.end.x, By = edge.end.y, Bz = edge.end.z;

    const isSegmentOccluded: boolean[] = [];

    for (let i = 0; i < segmentsCount; i++) {
      const tMid = (i + 0.5) / segmentsCount;
      const Px = Ax + (Bx - Ax) * tMid;
      const Py = Ay + (By - Ay) * tMid;
      const Pz = Az + (Bz - Az) * tMid;

      let isOccluded = false;

      const ox = Px;
      const oy = view === 'top' ? Py : -1000;
      const oz = view === 'top' ? 1000 : Pz;

      for (let j = 0; j < precomputedTriangles.length; j++) {
        const tri = precomputedTriangles[j];
        
        if (view === 'top') {
          if (Px < tri.minX - 0.05 || Px > tri.maxX + 0.05 || Py < tri.minY - 0.05 || Py > tri.maxY + 0.05) {
            continue;
          }
        } else {
          if (Px < tri.minX - 0.05 || Px > tri.maxX + 0.05 || Pz < tri.minZ - 0.05 || Pz > tri.maxZ + 0.05) {
            continue;
          }
        }

        const dist = rayTriangleIntersectOptimizedMath(
          ox, oy, oz,
          rx, ry, rz,
          tri.v0x, tri.v0y, tri.v0z,
          tri.v1x, tri.v1y, tri.v1z,
          tri.v2x, tri.v2y, tri.v2z
        );

        if (dist !== null) {
          if (view === 'top') {
            const zIntersect = 1000 - dist;
            if (zIntersect > Pz + 0.25) {
              isOccluded = true;
              break;
            }
          } else {
            const yIntersect = -1000 + dist;
            if (yIntersect < Py - 0.25) {
              isOccluded = true;
              break;
            }
          }
        }
      }

      isSegmentOccluded.push(isOccluded);
    }

    // Merge consecutive unoccluded segments to avoid generating multiple tiny lines
    let currentStartIdx: number | null = null;
    for (let i = 0; i <= segmentsCount; i++) {
      const isVisible = (i < segmentsCount) && !isSegmentOccluded[i];
      if (isVisible) {
        if (currentStartIdx === null) {
          currentStartIdx = i;
        }
      } else {
        if (currentStartIdx !== null) {
          const tStart = currentStartIdx / segmentsCount;
          const tEnd = i / segmentsCount;
          const pStart = new THREE.Vector3(Ax + (Bx - Ax) * tStart, Ay + (By - Ay) * tStart, Az + (Bz - Az) * tStart);
          const pEnd = new THREE.Vector3(Ax + (Bx - Ax) * tEnd, Ay + (By - Ay) * tEnd, Az + (Bz - Az) * tEnd);
          visibleSegments.push({ start: pStart, end: pEnd });
          currentStartIdx = null;
        }
      }
    }
  });

  return visibleSegments;
}

interface Line2D {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function mergeCollinear2DLines(lines: Line2D[], tolerance: number = 0.5): Line2D[] {
  let oriented = lines.map(line => {
    let { x1, y1, x2, y2 } = line;
    if (x1 > x2 + 1e-4 || (Math.abs(x1 - x2) < 1e-4 && y1 > y2)) {
      return { x1: x2, y1: y2, x2: x1, y2: y1 };
    }
    return { x1, y1, x2, y2 };
  });

  oriented = oriented.filter(line => {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    return Math.sqrt(dx * dx + dy * dy) > 1e-2;
  });

  const mergedLines: Line2D[] = [];

  while (oriented.length > 0) {
    let current = oriented.shift()!;
    let mergedAny = false;

    for (let i = 0; i < oriented.length; i++) {
      const other = oriented[i];

      const dx1 = current.x2 - current.x1;
      const dy1 = current.y2 - current.y1;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const dir1x = dx1 / len1;
      const dir1y = dy1 / len1;

      const dx2 = other.x2 - other.x1;
      const dy2 = other.y2 - other.y1;
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      const dir2x = dx2 / len2;
      const dir2y = dy2 / len2;

      const dot = Math.abs(dir1x * dir2x + dir1y * dir2y);
      if (dot > 0.999) {
        const nx = -dir1y;
        const ny = dir1x;
        const dist = Math.abs((other.x1 - current.x1) * nx + (other.y1 - current.y1) * ny);

        if (dist < tolerance) {
          const t_curr_start = 0;
          const t_curr_end = len1;

          const t_oth_start = (other.x1 - current.x1) * dir1x + (other.y1 - current.y1) * dir1y;
          const t_oth_end = (other.x2 - current.x1) * dir1x + (other.y2 - current.y1) * dir1y;

          const t_oth_min = Math.min(t_oth_start, t_oth_end);
          const t_oth_max = Math.max(t_oth_start, t_oth_end);

          const overlaps = !(t_oth_max < t_curr_start - tolerance || t_oth_min > t_curr_end + tolerance);
          if (overlaps) {
            const new_min_t = Math.min(0, t_oth_min);
            const new_max_t = Math.max(len1, t_oth_max);

            current = {
              x1: current.x1 + new_min_t * dir1x,
              y1: current.y1 + new_min_t * dir1y,
              x2: current.x1 + new_max_t * dir1x,
              y2: current.y1 + new_max_t * dir1y
            };

            oriented.splice(i, 1);
            i--;
            mergedAny = true;
          }
        }
      }
    }

    if (mergedAny) {
      oriented.unshift(current);
    } else {
      mergedLines.push(current);
    }
  }

  return mergedLines;
}

interface ScreenshotExporterProps {
  params: ModelParams;
  volume: number;
  dimensions: { x: number; y: number; z: number };
  language: "en" | "cy";
}

function ScreenshotExporter({ params, volume, dimensions, language }: ScreenshotExporterProps) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const handleScreenshot = (e: Event) => {
      const customEvent = e as CustomEvent;
      const isA4 = true; // Always force A4 format
      const isFrame = !!customEvent.detail?.frame;
      const isTitleBox = !!customEvent.detail?.titleBox;
      const isDate = !!customEvent.detail?.date;
      const is2DViews = !!customEvent.detail?.views2D;
      const isGrid = !!customEvent.detail?.grid;
      const isBasePlate = !!customEvent.detail?.basePlate;
      const isAxis = !!customEvent.detail?.axis;
      const isBuildVolume = !!customEvent.detail?.buildVolume;
      const designerName = customEvent.detail?.designer || "";
      const selectedScale = customEvent.detail?.scale || "Auto";
      const isPreview = !!customEvent.detail?.isPreview;

      // 1. Store original configuration
      const oldBg = scene.background;
      const oldSize = new THREE.Vector2();
      gl.getSize(oldSize);
      const oldAspect = (camera as THREE.PerspectiveCamera).aspect;
      const oldPixelRatio = gl.getPixelRatio();

      // If A4 / custom drawing is NOT enabled, run original snapshot mode
      if (!isA4 && !isFrame && !isTitleBox && !is2DViews) {
        scene.background = new THREE.Color("#FFFFFF");
        const exportWidth = 1600;
        const exportHeight = 1200;
        gl.setPixelRatio(1);
        gl.setSize(exportWidth, exportHeight, false);
        (camera as THREE.PerspectiveCamera).aspect = exportWidth / exportHeight;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

        gl.render(scene, camera);
        const dataURL = gl.domElement.toDataURL("image/jpeg", 0.98);

        scene.background = oldBg;
        gl.setPixelRatio(oldPixelRatio);
        gl.setSize(oldSize.x, oldSize.y, true);
        (camera as THREE.PerspectiveCamera).aspect = oldAspect;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        gl.render(scene, camera);

        const link = document.createElement("a");
        const customFileName = customEvent.detail?.fileName
          ? `${customEvent.detail.fileName}.jpg`
          : "extruder_model_capture.jpg";
        link.download = customFileName;
        link.href = dataURL;
        link.click();
        return;
      }

      // OTHERWISE: Create an A4 Portrait or landscape technical drawing composite!
      // Set solid white background for high quality drawing snaps
      scene.background = new THREE.Color("#FFFFFF");
      gl.setPixelRatio(1.5); // crisper renders

      const origPos = camera.position.clone();
      const origUp = camera.up.clone();

      // Determine scale based on Whether Technical Drawing (is2DViews) is on or off
      let finalScaleFactor = 1.0;
      let scaleLabelLabel = "1:1";
      const maxDim = Math.max(dimensions.x, dimensions.y, dimensions.z);
      // Tighten the camera viewport to make the image fit snugly with less empty border
      const isoSizeMm = maxDim * 1.35 + 12;
      let pixels_per_mm = 10.0;

      if (is2DViews) {
        // "technical drawing" option is on, views are at a precise standard scale depending on the real life model size
        // We select the largest standard scale factor that safely fits without any vertical or horizontal overlap
        const standardScales = [
          { label: "5:1", factor: 5.0 },
          { label: "2:1", factor: 2.0 },
          { label: "1:1", factor: 1.0 },
          { label: "1:2", factor: 0.5 },
          { label: "1:5", factor: 0.2 },
          { label: "1:10", factor: 0.1 },
          { label: "1:20", factor: 0.05 },
          { label: "1:50", factor: 0.02 },
        ];

        const safeScale = standardScales.find(s => {
          const f = s.factor;
          const p_mm = f * 10;
          const fHMm = dimensions.z + 10;
          const tHMm = dimensions.y + 10;
          const fWMm = dimensions.x + 10;
          const tWMm = dimensions.x + 10;

          // Vertical check: total height of the two stacked views + label clearances.
          // In A4 landscape (height is 2100px), we have total height of (tHMm + fHMm) * p_mm.
          // We ensure there is ample room for titles, margins, labels, and text.
          const totalDrawnHeight = (tHMm + fHMm) * p_mm;
          const vFit = totalDrawnHeight <= 1700; // Optimal vertical space usage allowed on 2100px sheet

          // Horizontal check: width of left views + width of right 3D isometric view.
          // In A4 landscape (width is 2970px), the total horizontal footprint of 2D views is Math.max(tWMm, fWMm) * p_mm.
          // The footprint of 3D isometric view is isoSizeMm * p_mm.
          // They should not overlap each other or stick to A4 side margins.
          const totalDrawnWidth = (Math.max(tWMm, fWMm) + isoSizeMm) * p_mm;
          const hFit = totalDrawnWidth <= 2400; // Optimal horizontal space usage allowed on 2970px sheet

          return vFit && hFit;
        });

        const bestScale = safeScale || standardScales[standardScales.length - 1];
        finalScaleFactor = bestScale.factor;
        scaleLabelLabel = bestScale.label;
        pixels_per_mm = finalScaleFactor * 10;
      } else {
        // "technical drawing" option is off, the 3D model view fits nicely and fills the A4 sheet significantly bigger
        pixels_per_mm = 1750 / isoSizeMm;
        finalScaleFactor = pixels_per_mm / 10;
        scaleLabelLabel = "Fits to Sheet (NTS)";
      }

      // Find extruded model to configure capture materials
      const modelMesh = scene.getObjectByName("extruded-model") as THREE.Mesh;
      const hasGeometry = modelMesh && modelMesh.geometry && modelMesh.geometry.attributes.position && modelMesh.geometry.attributes.position.count > 0;
      if (isPreview && is2DViews && !hasGeometry) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('export-picture', { detail: customEvent.detail }));
        }, 150);
        return;
      }
      let originalMaterial: THREE.Material | THREE.Material[] | null = null;
      let edgesLines: THREE.LineSegments | null = null;

      // Temporarily store original visibilities & configure active drawing layers
      scene.traverse((obj) => {
        obj.userData.wasVisible = obj.visible;
        if (obj !== modelMesh && obj.parent !== modelMesh) {
          if (
            obj instanceof THREE.Mesh || 
            obj instanceof THREE.Line || 
            obj instanceof THREE.Points ||
            obj.name.includes("Helper") ||
            obj.name.includes("grid") ||
            obj.name.includes("axis") ||
            obj.name.includes("plane") ||
            obj.name.includes("baseplate") ||
            obj.name.includes("build-volume")
          ) {
            let shouldBeVisible = false;
            if (isGrid && (obj.name === "printer-grid" || obj.name.includes("grid"))) {
              shouldBeVisible = true;
            }
            if (isBasePlate && (obj.name === "printer-baseplate" || obj.name.includes("baseplate"))) {
              shouldBeVisible = true;
            }
            if (isAxis && (obj.name === "printer-axis" || obj.name.includes("axis"))) {
              shouldBeVisible = true;
            }
            if (isBuildVolume && (obj.name === "printer-build-volume" || obj.name.includes("build-volume"))) {
              shouldBeVisible = true;
            }
            obj.visible = shouldBeVisible;
          }
        }
      });

      // Helper to capture a view of the scene using a clean OrthographicCamera
      const captureOrthographicView = (
        camPos: THREE.Vector3,
        camUp: THREE.Vector3,
        lookTarget: THREE.Vector3,
        widthMm: number,
        heightMm: number,
        transparent: boolean = true
      ): string => {
        const orthoCam = new THREE.OrthographicCamera(
          -widthMm / 2,
          widthMm / 2,
          heightMm / 2,
          -heightMm / 2,
          0.1,
          5000
        );
        orthoCam.position.copy(camPos);
        orthoCam.up.copy(camUp);
        orthoCam.lookAt(lookTarget);
        orthoCam.updateProjectionMatrix();

        // Use a high constant rendering resolution (e.g., 15.0 px per mm) to ensure all scaled drawings remain extremely sharp without pixelation
        const capture_pixels_per_mm = 15.0;
        const wPx = Math.min(Math.round(widthMm * capture_pixels_per_mm), 3072);
        const hPx = Math.min(Math.round(heightMm * capture_pixels_per_mm), 3072);

        gl.setSize(wPx, hPx, false);

        const oldBg = scene.background;
        const oldClearColor = new THREE.Color();
        gl.getClearColor(oldClearColor);
        const oldClearAlpha = gl.getClearAlpha();

        if (transparent) {
          scene.background = null;
          gl.setClearColor(0x000000, 0); // Transparent canvas alpha clear
        } else {
          scene.background = new THREE.Color("#FFFFFF");
        }

        gl.render(scene, orthoCam);
        const dataUrl = gl.domElement.toDataURL(transparent ? "image/png" : "image/jpeg", transparent ? undefined : 0.98);

        // Restore GL state
        scene.background = oldBg;
        gl.setClearColor(oldClearColor, oldClearAlpha);

        return dataUrl;
      };

      // Helper to capture a view of the scene using a clean PerspectiveCamera that matches the live interactive view
      const capturePerspectiveView = (
        transparent: boolean = true
      ): string => {
        const destWidth = 2970;
        const destHeight = 2100;
        gl.setSize(destWidth, destHeight, false);

        // Standard perspective camera cloned from active user workspace camera
        const persCam = (camera as THREE.PerspectiveCamera).clone();
        persCam.aspect = destWidth / destHeight;
        persCam.updateProjectionMatrix();

        const oldBg = scene.background;
        const oldClearColor = new THREE.Color();
        gl.getClearColor(oldClearColor);
        const oldClearAlpha = gl.getClearAlpha();

        if (transparent) {
          scene.background = null;
          gl.setClearColor(0x000000, 0); // Transparent canvas alpha clear
        } else {
          scene.background = new THREE.Color("#FFFFFF");
        }

        gl.render(scene, persCam);
        const dataUrl = gl.domElement.toDataURL(transparent ? "image/png" : "image/jpeg", transparent ? undefined : 0.98);

        // Restore GL state
        scene.background = oldBg;
        gl.setClearColor(oldClearColor, oldClearAlpha);

        return dataUrl;
      };

      const targetZ = params.height / 2;

      // Position the camera appropriately.
      // If technical drawing is selected (is2DViews === true), we show the 3D view using the active orthographic camera's current layout from user interaction if available
      const pData = is2DViews
        ? captureOrthographicView(
            camera.position.clone(),
            camera.up.clone(),
            new THREE.Vector3(0, 0, targetZ),
            isoSizeMm / (camera.zoom || 1),
            isoSizeMm / (camera.zoom || 1),
            true // transparent background PNG
          )
        : capturePerspectiveView(true);

      let fDataShading = "";
      let fDataLinesRaw = "";
      let fDataLines = "";
      let rDataShading = "";
      let rDataLinesRaw = "";
      let rDataLines = "";
      const extraLines: THREE.LineSegments[] = [];

      // 2. Capture the flat 2D projection views
      // The camera framing remains constant and perfectly snug to the model's dimensions
      const frontWidthMm = dimensions.x + 10;
      const frontHeightMm = dimensions.z + 10;
      const topWidthMm = dimensions.x + 10;
      const topHeightMm = dimensions.y + 10;

      if (is2DViews) {
        // Separately manage visibilities of grid, baseplate, axes, volume guides
        scene.traverse((obj) => {
          if (obj !== modelMesh && obj.parent !== modelMesh) {
            if (obj.name.includes("grid")) {
              obj.visible = isGrid;
            } else if (obj.name.includes("baseplate")) {
              obj.visible = isBasePlate;
            } else if (obj.name.includes("axis")) {
              obj.visible = isAxis;
            } else if (obj.name.includes("build-volume")) {
              obj.visible = isBuildVolume;
            }
          }
        });

        // Create custom Cel/Toon shade material with exactly 4 shading levels and smooth contour edge detections
        const celMaterial = new THREE.ShaderMaterial({
          uniforms: {
            brightColor: { value: new THREE.Color("#FFFFFF") },
            shadowColor1: { value: new THREE.Color("#F3F4F6") }, // Level 1 (Lightest shadow)
            shadowColor2: { value: new THREE.Color("#E5E7EB") }, // Level 2 (Light shadow)
            shadowColor3: { value: new THREE.Color("#D1D5DB") }, // Level 3 (Medium shadow)
            shadowColor4: { value: new THREE.Color("#9CA3AF") }, // Level 4 (Darkest shadow)
          },
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            uniform vec3 brightColor;
            uniform vec3 shadowColor1;
            uniform vec3 shadowColor2;
            uniform vec3 shadowColor3;
            uniform vec3 shadowColor4;
            void main() {
              vec3 n = normalize(vNormal);
              
              // Light source slightly offset to front-right-top
              vec3 lightDir = normalize(vec3(0.35, 0.45, 0.82));
              float intensity = dot(n, lightDir);
              
              // Exactly 4 shading levels + 1 bright level
              vec3 baseColor;
              if (intensity > 0.65) {
                baseColor = brightColor;
              } else if (intensity > 0.3) {
                baseColor = shadowColor1;
              } else if (intensity > -0.05) {
                baseColor = shadowColor2;
              } else if (intensity > -0.4) {
                baseColor = shadowColor3;
              } else {
                baseColor = shadowColor4;
              }
              
              // Detect side vertical outlines and silhouettes parallel to camera ray (n.z near 0)
              if (abs(n.z) < 0.16) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // solid black outline
              } else {
                gl_FragColor = vec4(baseColor, 1.0);
              }
            }
          `,
          side: THREE.DoubleSide,
          depthWrite: true,
        });

        // Set up the monochrome wireframe-with-edges material for true black & white 2D views
        if (modelMesh) {
          originalMaterial = modelMesh.material;
          modelMesh.material = celMaterial;

          // Draw highly visible black 2D edges with a crisp threshold angle of 24 degrees
          // to dramatically clear up edge detection, eliminating complex facet/shading line noise
          const edgesGeom = new THREE.EdgesGeometry(modelMesh.geometry, 24);
          edgesLines = new THREE.LineSegments(
            edgesGeom,
            new THREE.LineBasicMaterial({ color: "#000000" })
          );
          modelMesh.add(edgesLines);

          // For thicker, bolder lines on high-res output, draw offset copies
          const offsetSize = 0.12; // offset in millimeters
          const offsets = [
            [offsetSize, 0, 0],
            [-offsetSize, 0, 0],
            [0, offsetSize, 0],
            [0, -offsetSize, 0],
            [0, 0, offsetSize],
            [0, 0, -offsetSize],
            [offsetSize, offsetSize, 0],
            [-offsetSize, -offsetSize, 0],
          ];
          offsets.forEach(([dx, dy, dz]) => {
            if (edgesLines) {
              const lineCln = edgesLines.clone();
              lineCln.position.set(dx, dy, dz);
              modelMesh.add(lineCln);
              extraLines.push(lineCln);
            }
          });
        }

        // Step A: Capture shading details with different levels of grey (lines invisible)
        if (edgesLines) edgesLines.visible = false;
        extraLines.forEach(line => { line.visible = false; });

        fDataShading = captureOrthographicView(
          new THREE.Vector3(0, -500, targetZ),
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, targetZ),
          frontWidthMm,
          frontHeightMm,
          true // transparent background PNG
        );

        rDataShading = captureOrthographicView(
          new THREE.Vector3(0, 0, 500 + targetZ),
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, targetZ),
          topWidthMm,
          topHeightMm,
          true // transparent background PNG
        );

        // Step B: Capture black lines only (using Depth-Masking for instant transparent backgrounds)
        if (edgesLines) edgesLines.visible = true;
        extraLines.forEach(line => { line.visible = true; });

        let depthMaskMaterial: THREE.MeshBasicMaterial | null = null;
        if (modelMesh) {
          depthMaskMaterial = new THREE.MeshBasicMaterial({
            colorWrite: false, // Writes only to depth buffer to obscure back lines
            depthWrite: true,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
          });
          modelMesh.material = depthMaskMaterial;
        }

        fDataLines = captureOrthographicView(
          new THREE.Vector3(0, -500, targetZ),
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, targetZ),
          frontWidthMm,
          frontHeightMm,
          true // transparent background PNG
        );

        rDataLines = captureOrthographicView(
          new THREE.Vector3(0, 0, 500 + targetZ),
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, targetZ),
          topWidthMm,
          topHeightMm,
          true // transparent background PNG
        );

        // Restore celMaterial for drawing
        if (modelMesh) {
          modelMesh.material = celMaterial;
          if (depthMaskMaterial) depthMaskMaterial.dispose();
        }

        // Restore materials & edges
        if (modelMesh) {
          if (originalMaterial) modelMesh.material = originalMaterial;
          if (edgesLines) {
            modelMesh.remove(edgesLines);
            edgesLines.geometry.dispose();
          }
          extraLines.forEach(line => {
            modelMesh.remove(line);
            line.geometry.dispose();
          });
        }
      }

      // Restore all original auxiliary visibilities & interactive state
      scene.traverse((obj) => {
        if (obj.userData.wasVisible !== undefined) {
          obj.visible = obj.userData.wasVisible;
          delete obj.userData.wasVisible;
        }
      });

      scene.background = oldBg;
      gl.setPixelRatio(oldPixelRatio);
      gl.setSize(oldSize.x, oldSize.y, true);
      (camera as THREE.PerspectiveCamera).aspect = oldAspect;
      camera.position.copy(origPos);
      camera.up.copy(origUp);
      camera.lookAt(0, 0, targetZ);
      camera.updateProjectionMatrix();
      gl.render(scene, camera);

      // Async loading and canvas composition
      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.error("Failed to load image:", src);
            resolve(img); // Resolve with original image object so execution continues
          };
          img.src = src;
        });
      };

      const drawArrow = (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) => {
        const headlen = 12; // length of head in pixels
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      };

      const drawDimensionLine = (
        ctx: CanvasRenderingContext2D,
        x1: number, y1: number,
        x2: number, y2: number,
        labelText: string,
        offset: number,
        isVertical: boolean
      ) => {
        ctx.strokeStyle = "#475569"; // Slate gray technical line
        ctx.lineWidth = 2.5;
        ctx.fillStyle = "#475569";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw extension lines
        ctx.beginPath();
        if (isVertical) {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 - offset, y1);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - offset, y2);
          ctx.stroke();

          // Dimension line
          const dimX = x1 - offset + Math.sign(offset) * 15;
          ctx.beginPath();
          ctx.moveTo(dimX, y1);
          ctx.lineTo(dimX, y2);
          ctx.stroke();

          // Draw arrows pointing outwards touching the extension lines
          drawArrow(ctx, dimX, y1 + 15, dimX, y1);
          drawArrow(ctx, dimX, y2 - 15, dimX, y2);

          // Text (Vertical rotated)
          ctx.save();
          ctx.translate(dimX - 22 * Math.sign(offset), (y1 + y2) / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(labelText, 0, 0);
          ctx.restore();
        } else {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1, y1 + offset);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2, y2 + offset);
          ctx.stroke();

          // Dimension line
          const dimY = y1 + offset - Math.sign(offset) * 15;
          ctx.beginPath();
          ctx.moveTo(x1, dimY);
          ctx.lineTo(x2, dimY);
          ctx.stroke();

          // Draw arrows pointing outwards touching the extension lines
          drawArrow(ctx, x1 + 15, dimY, x1, dimY);
          drawArrow(ctx, x2 - 15, dimY, x2, dimY);

          // Text centered above the line
          ctx.fillText(labelText, (x1 + x2) / 2, dimY - 20 * Math.sign(offset));
        }
      };

      const makeWhitePixelsTransparent = (dataUrl: string): Promise<string> => {
        return new Promise((resolve) => {
          if (!dataUrl) {
            resolve("");
            return;
          }
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(dataUrl);
              return;
            }
            ctx.drawImage(img, 0, 0);
            try {
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imgData.data;
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Check if the pixel is near-white (all channels above 240)
                if (r > 240 && g > 240 && b > 240) {
                  data[i + 3] = 0; // set alpha to 0
                }
              }
              ctx.putImageData(imgData, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            } catch (err) {
              console.error("Error keying white pixels", err);
              resolve(dataUrl);
            }
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        });
      };

      const buildCompositeCanvas = async () => {
        const canvas2D = document.createElement("canvas");
        // standard landscape high resolution (A4 aspect ratio)
        canvas2D.width = 2970;
        canvas2D.height = 2100;
        const ctx = canvas2D.getContext("2d");
        if (!ctx) return;

        // Enable high-quality browser downsampling for smoother lines and edges
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Default paper background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas2D.width, canvas2D.height);

        // Load images
        const pImg = await loadImg(pData);
        const logoImg = await loadImg(logoUrl);
        let logoBase64 = "";
        try {
          const offCanvas = document.createElement("canvas");
          offCanvas.width = logoImg.naturalWidth || logoImg.width || 200;
          offCanvas.height = logoImg.naturalHeight || logoImg.height || 160;
          const offCtx = offCanvas.getContext("2d");
          if (offCtx) {
            offCtx.drawImage(logoImg, 0, 0);
            logoBase64 = offCanvas.toDataURL("image/png");
          }
        } catch (e) {
          console.error("Failed to convert logo to base64", e);
        }

        let fImgShading: HTMLImageElement | null = null;
        let fImgLines: HTMLImageElement | null = null;
        let rImgShading: HTMLImageElement | null = null;
        let rImgLines: HTMLImageElement | null = null;
        if (fDataShading) fImgShading = await loadImg(fDataShading);
        if (fDataLines) fImgLines = await loadImg(fDataLines);
        if (rDataShading) rImgShading = await loadImg(rDataShading);
        if (rDataLines) rImgLines = await loadImg(rDataLines);

        const leftMargin = isFrame ? 150 : 75;
        const topMargin = 75;
        const rightMargin = 75;
        const bottomMargin = 75;

        // Draw models and layout
        if (is2DViews && fImgShading && fImgLines && rImgShading && rImgLines) {
          const tW_drawn = topWidthMm * pixels_per_mm;
          const tH_drawn = topHeightMm * pixels_per_mm;
          const fW_drawn = frontWidthMm * pixels_per_mm;
          const fH_drawn = frontHeightMm * pixels_per_mm;
          const pW_drawn = isoSizeMm * pixels_per_mm;

          // Maximum physical width of 2D views is determined dynamically based on Top/Front aspect ratios
          const max2DWidth = Math.max(tW_drawn, fW_drawn);
          const W_3d = pW_drawn;

          // Align views so that the gap (left, right, and between the views) is exactly equal.
          // Start boundary is leftMargin, end boundary is canvas2D.width - rightMargin.
          const startX = leftMargin;
          const endX = canvas2D.width - rightMargin;
          const totalWidthAvailable = endX - startX;

          // 3 * gap + max2DWidth + W_3d = totalWidthAvailable
          // gap = (totalWidthAvailable - max2DWidth - W_3d) / 3
          const equalGap = (totalWidthAvailable - max2DWidth - W_3d) / 3;

          const cx_2d = startX + equalGap + max2DWidth / 2;
          const cx_3d = endX - equalGap - W_3d / 2;
          const half_3d = pW_drawn / 2;

          // Vertical centers for 1st Angle Orthographic Projection:
          // Top view is ABOVE Front view.
          // We calculate dynamic vertical centering based on the actual drawn heights of the top and front views.
          const totalDrawnHeight = tH_drawn + fH_drawn;
          const availableHeight = 2100 - 300; // 1800 px of workspace height
          const verticalGap = (availableHeight - totalDrawnHeight) / 3;

          const cy_top = 150 + verticalGap + tH_drawn / 2;
          const cy_front = cy_top + tH_drawn / 2 + verticalGap + fH_drawn / 2;

          // 3D View is on the right side of the sheet, centered safely above the bottom-right title box
          const cy_3d = 850;

          // Render Top View (combining shading and transparent lines)
          ctx.drawImage(rImgShading, cx_2d - tW_drawn / 2, cy_top - tH_drawn / 2, tW_drawn, tH_drawn);
          ctx.drawImage(rImgLines, cx_2d - tW_drawn / 2, cy_top - tH_drawn / 2, tW_drawn, tH_drawn);

          // Label Top View
          ctx.fillStyle = "#1E293B";
          ctx.font = "bold 24px monospace";
          ctx.textAlign = "center";
          ctx.fillText(language === "cy" ? "Gwedd Dropsiwm (Top)" : "Top View", cx_2d, cy_top + tH_drawn / 2 + 40);

          // Render Front View (combining shading and transparent lines)
          ctx.drawImage(fImgShading, cx_2d - fW_drawn / 2, cy_front - fH_drawn / 2, fW_drawn, fH_drawn);
          ctx.drawImage(fImgLines, cx_2d - fW_drawn / 2, cy_front - fH_drawn / 2, fW_drawn, fH_drawn);

          // Label Front View
          ctx.fillStyle = "#1E293B";
          ctx.font = "bold 24px monospace";
          ctx.fillText(language === "cy" ? "Gwedd Blaen" : "Front View", cx_2d, cy_front + fH_drawn / 2 + 40);

          // Render 3D Isometric View on the Right side
          if (!isPreview) {
            ctx.drawImage(pImg, cx_3d - half_3d, cy_3d - half_3d, pW_drawn, pW_drawn);
          }

          // Label 3D Isometric View
          ctx.fillStyle = "#1E293B";
          ctx.font = "bold 24px monospace";
          ctx.fillText(language === "cy" ? "Golwg Isometrig 3D" : "Isometric 3D View", cx_3d, cy_3d + half_3d + 40);

          // Bounding Box Overlays are drawn perfectly based on physical dimensions
          const modelW_drawn = dimensions.x * pixels_per_mm;
          const modelH_drawn = dimensions.z * pixels_per_mm;
          const modelD_drawn = dimensions.y * pixels_per_mm;

          // Height (Z) on Front View
          const hX1 = cx_2d - modelW_drawn / 2;
          const hY1 = cy_front - modelH_drawn / 2;
          const hX2 = hX1;
          const hY2 = cy_front + modelH_drawn / 2;
          drawDimensionLine(ctx, hX1, hY1, hX2, hY2, `${dimensions.z.toFixed(1)} mm`, 85, true);

          // Width (X) on Front View
          const wX1 = cx_2d - modelW_drawn / 2;
          const wY1 = cy_front + modelH_drawn / 2;
          const wX2 = cx_2d + modelW_drawn / 2;
          const wY2 = wY1;
          drawDimensionLine(ctx, wX1, wY1, wX2, wY2, `${dimensions.x.toFixed(1)} mm`, 65, false);

          // Depth (Y) on Top View
          const dyX1 = cx_2d + modelW_drawn / 2;
          const dyY1 = cy_top - modelD_drawn / 2;
          const dyX2 = dyX1;
          const dyY2 = cy_top + modelD_drawn / 2;
          drawDimensionLine(ctx, dyX1, dyY1, dyX2, dyY2, `${dimensions.y.toFixed(1)} mm`, -75, true);

        } else {
          // Centered 3D Model View without 2D snapshots
          // Since the perspective image already matches the exact 2970x2100 aspect ratio and frames the model with our custom rotate/zoom,
          // we draw the entire image across the A4 canvas to preserve the exact camera layout, rotation and zoom from the interactive preview!
          ctx.drawImage(pImg, 0, 0, canvas2D.width, canvas2D.height);
        }

        // Title box rendering
        if (isTitleBox) {
          const tbW = 1600;
          const tbH = 340;
          // Shift strictly inside the borders to prevent overlap on outer frame
          const tbX = canvas2D.width - rightMargin - tbW - 6;
          const tbY = canvas2D.height - bottomMargin - tbH - 6;

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(tbX, tbY, tbW, tbH);

          // Outer border
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 4;
          ctx.strokeRect(tbX, tbY, tbW, tbH);

          // Inside dividers (Row height is 85px)
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#000000";
          ctx.moveTo(tbX + 250, tbY + 85);
          ctx.lineTo(tbX + tbW, tbY + 85);

          ctx.moveTo(tbX + 250, tbY + 170);
          ctx.lineTo(tbX + tbW, tbY + 170);

          ctx.moveTo(tbX + 250, tbY + 255);
          ctx.lineTo(tbX + tbW, tbY + 255);

          // Vertical divider for Logo Section (250px wide)
          ctx.moveTo(tbX + 250, tbY);
          ctx.lineTo(tbX + 250, tbY + tbH);

          // Vertical divider for Details Section (at 1000px to divide remaining columns 750px/600px)
          ctx.moveTo(tbX + 1000, tbY + 85);
          ctx.lineTo(tbX + 1000, tbY + tbH);
          ctx.stroke();

          // Render top bar logo in the left column (centered in 250px width x 340px height cell)
          const logoW = 200;
          const logoH = 160;
          const logoX = tbX + (250 - logoW) / 2;
          const logoY = tbY + (340 - logoH) / 2;
          ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);

          // Title / Subject: Model's Name (aligned to column 2 starting at tbX + 270)
          let finalDispName = customEvent.detail?.fileName || "extruder_model";
          if (finalDispName.length > 25) finalDispName = finalDispName.substring(0, 23) + "...";

          ctx.fillStyle = "#000000";
          ctx.font = "bold 44px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(finalDispName.toUpperCase(), tbX + 270, tbY + 56);

          ctx.font = "bold 42px monospace";
          ctx.textAlign = "left";

          // Row 2: Sheet & Date (Baseline at tbY + 141)
          // Left: Sheet: A4
          const labelSheet = language === "cy" ? "DALEN" : "SHEET";
          ctx.fillStyle = "#000000";
          ctx.fillText(`${labelSheet}: `, tbX + 270, tbY + 141);
          const sheetLabelWidth = ctx.measureText(`${labelSheet}: `).width;
          ctx.fillStyle = "#000000";
          ctx.fillText("A4", tbX + 270 + sheetLabelWidth, tbY + 141);

          // Right: Date
          const labelDate = language === "cy" ? "DYDDIAD" : "DATE";
          ctx.fillStyle = "#000000";
          ctx.fillText(`${labelDate}: `, tbX + 1020, tbY + 141);
          const dateLabelWidth = ctx.measureText(`${labelDate}: `).width;
          ctx.fillStyle = "#000000";
          const dateStr = isDate 
            ? new Date().toLocaleDateString(language === "cy" ? "cy-GB" : "en-GB", { year: 'numeric', month: 'short', day: 'numeric' })
            : "-";
          ctx.fillText(dateStr, tbX + 1020 + dateLabelWidth, tbY + 141);

          // Row 3: Model Volume & Scale (Baseline at tbY + 226)
          // Left: Volume
          const labelVol = language === "cy" ? "CYFAINT" : "VOLUME";
          ctx.fillStyle = "#000000";
          ctx.fillText(`${labelVol}: `, tbX + 270, tbY + 226);
          const volLabelWidth = ctx.measureText(`${labelVol}: `).width;
          ctx.fillStyle = "#000000";
          ctx.fillText(`${(volume / 1000).toFixed(2)} cm³`, tbX + 270 + volLabelWidth, tbY + 226);

          // Right: Scale
          const labelScale = language === "cy" ? "GRADDFA" : "SCALE";
          ctx.fillStyle = "#000000";
          ctx.fillText(`${labelScale}: `, tbX + 1020, tbY + 226);
          const scaleLabelWidth = ctx.measureText(`${labelScale}: `).width;
          ctx.fillStyle = "#000000";
          ctx.fillText(scaleLabelLabel, tbX + 1020 + scaleLabelWidth, tbY + 226);

          // Row 4: Dimensions & Designer (Baseline at tbY + 311)
          // Left: Dimensions
          const labelDim = language === "cy" ? "MESURAU" : "DIM.";
          ctx.fillStyle = "#000000";
          ctx.fillText(`${labelDim}: `, tbX + 270, tbY + 311);
          const dimLabelWidth = ctx.measureText(`${labelDim}: `).width;
          ctx.fillStyle = "#000000";
          ctx.fillText(`${dimensions.x.toFixed(1)}x${dimensions.y.toFixed(1)}x${dimensions.z.toFixed(1)}mm`, tbX + 270 + dimLabelWidth, tbY + 311);

          // Right: Designer
          const labelDes = language === "cy" ? "CYNLLUNYDD" : "BY";
          ctx.fillStyle = "#000000";
          ctx.fillText(`${labelDes}: `, tbX + 1020, tbY + 311);
          const desLabelWidth = ctx.measureText(`${labelDes}: `).width;
          ctx.fillStyle = "#000000";
          ctx.fillText(designerName || "-", tbX + 1020 + desLabelWidth, tbY + 311);
        }

        // Drawing margins Frame (Draw last so it is not obscured by any overlay background)
        // Only 1 border frame line is drawn, removing the faint inner border
        if (isFrame) {
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 6;
          ctx.strokeRect(leftMargin, topMargin, canvas2D.width - leftMargin - rightMargin, canvas2D.height - topMargin - bottomMargin);
        }

        // Trigger safe drawing download or preview ready
        const format = customEvent.detail?.format || "jpeg";
        const finalFileName = customEvent.detail?.fileName || "extruder";

        if (isPreview) {
          const drawingURL = canvas2D.toDataURL("image/jpeg", 0.95);
          window.dispatchEvent(new CustomEvent('drawing-preview-ready', { 
            detail: { 
              dataUrl: drawingURL 
            } 
          }));
        } else {
          if (format === "pdf") {
            const drawingURL = canvas2D.toDataURL("image/jpeg", 0.98);
            const pdf = new jsPDF({
              orientation: "landscape",
              unit: "mm",
              format: "a4",
            });
            pdf.addImage(drawingURL, "JPEG", 0, 0, 297, 210);
            pdf.save(`${finalFileName}.pdf`);
          } else if (format === "svg") {
            const bgElements: string[] = [];
            const shadingLayerElements: string[] = [];
            const linesLayerElements: string[] = [];
            const isometricLayerElements: string[] = [];
            const borderLayerElements: string[] = [];
            const annotationLayerElements: string[] = [];

            // Add background rectangle to background elements
            bgElements.push(`<rect width="2970" height="2100" fill="#FFFFFF"/>`);

            const leftMargin = isFrame ? 150 : 75;
            const topMargin = 75;
            const rightMargin = 75;
            const bottomMargin = 75;

            const tW_drawn = topWidthMm * pixels_per_mm;
            const tH_drawn = topHeightMm * pixels_per_mm;
            const fW_drawn = frontWidthMm * pixels_per_mm;
            const fH_drawn = frontHeightMm * pixels_per_mm;
            const pW_drawn = isoSizeMm * pixels_per_mm;

            // Mathematical Balance Calculation for SVG:
            const max2DWidth = Math.max(tW_drawn, fW_drawn);
            const startX = leftMargin;
            const endX = 2970 - rightMargin;
            const totalWidthAvailable = endX - startX;
            const equalGap = (totalWidthAvailable - max2DWidth - pW_drawn) / 3;

            const cx_2d = startX + equalGap + max2DWidth / 2;
            const cx_3d = is2DViews ? (endX - equalGap - pW_drawn / 2) : (2970 / 2);
            const cy_3d = is2DViews ? 850 : 950;

            // Embed rendered 3D Isometric View
            if (pData) {
              isometricLayerElements.push(`<!-- 3D Isometric View -->`);
              if (is2DViews) {
                isometricLayerElements.push(`<image href="${pData}" x="${cx_3d - pW_drawn / 2}" y="${cy_3d - pW_drawn / 2}" width="${pW_drawn}" height="${pW_drawn}"/>`);
                isometricLayerElements.push(`<text x="${cx_3d}" y="${cy_3d + pW_drawn / 2 + 40}" fill="#1E293B" font-family="monospace" font-weight="bold" font-size="24" text-anchor="middle">${language === "cy" ? "Golwg Isometrig 3D" : "Isometric 3D View"}</text>`);
              } else {
                isometricLayerElements.push(`<image href="${pData}" x="0" y="0" width="2970" height="2100"/>`);
              }
            }

            // Embed 2D Orthographic Views if enabled
            if (is2DViews && fDataShading && fDataLines && rDataShading && rDataLines) {
              const totalDrawnHeight = tH_drawn + fH_drawn;
              const availableHeight = 2100 - 300; // 1800 px of workspace height
              const verticalGap = (availableHeight - totalDrawnHeight) / 3;

              const cy_top = 150 + verticalGap + tH_drawn / 2;
              const cy_front = cy_top + tH_drawn / 2 + verticalGap + fH_drawn / 2;

              // Render Top View Shading & Lines
              if (modelMesh) {
                const triangles = getMeshTriangles(modelMesh);
                const topEdges = getViewEdges(modelMesh, "top");
                const frontEdges = getViewEdges(modelMesh, "front");

                const visibleTopSegments = computeVisibleLineSegments(topEdges, triangles, "top", targetZ);
                const visibleFrontSegments = computeVisibleLineSegments(frontEdges, triangles, "front", targetZ);

                // 1. TOP VIEW VECTOR SHADING
                shadingLayerElements.push(`<!-- Top View Vector Shading (Greys) -->`);
                let topObjects = triangles
                  .map(tri => {
                    const normal = new THREE.Vector3();
                    tri.getNormal(normal);
                    const avgZ = (tri.a.z + tri.b.z + tri.c.z) / 3;
                    const edge1 = new THREE.Vector3().subVectors(tri.b, tri.a);
                    const edge2 = new THREE.Vector3().subVectors(tri.c, tri.a);
                    const area = 0.5 * new THREE.Vector3().crossVectors(edge1, edge2).length();
                    return { tri, normal, avgZ, area };
                  })
                  .filter(item => item.normal.z > -1e-4);

                if (topObjects.length > 600) {
                  topObjects.sort((a, b) => b.area - a.area);
                  topObjects = topObjects.slice(0, 600);
                }

                // Painter's Algorithm: lowest avgZ drawn first so that closest faces on top
                topObjects.sort((a, b) => a.avgZ - b.avgZ);

                const lightDir = new THREE.Vector3(0.35, 0.45, 0.82).normalize();
                const topColorPaths: { [color: string]: string[] } = {};

                topObjects.forEach(item => {
                  const { tri, normal } = item;
                  const n_cam = normal.clone().normalize();
                  const intensity = n_cam.dot(lightDir);

                  let baseColor = "#FFFFFF";
                  if (intensity > 0.65) {
                    baseColor = "#FFFFFF";
                  } else if (intensity > 0.3) {
                    baseColor = "#F3F4F6";
                  } else if (intensity > -0.05) {
                    baseColor = "#E5E7EB";
                  } else if (intensity > -0.4) {
                    baseColor = "#D1D5DB";
                  } else {
                    baseColor = "#9CA3AF";
                  }

                  const ax = cx_2d + tri.a.x * pixels_per_mm;
                  const ay = cy_top - tri.a.y * pixels_per_mm;
                  const bx = cx_2d + tri.b.x * pixels_per_mm;
                  const by = cy_top - tri.b.y * pixels_per_mm;
                  const cx = cx_2d + tri.c.x * pixels_per_mm;
                  const cy = cy_top - tri.c.y * pixels_per_mm;

                  const dSeg = `M ${ax.toFixed(2)} ${ay.toFixed(2)} L ${bx.toFixed(2)} ${by.toFixed(2)} L ${cx.toFixed(2)} ${cy.toFixed(2)} Z`;
                  if (!topColorPaths[baseColor]) {
                    topColorPaths[baseColor] = [];
                  }
                  topColorPaths[baseColor].push(dSeg);
                });

                Object.keys(topColorPaths).forEach(color => {
                  const combinedD = topColorPaths[color].join(" ");
                  shadingLayerElements.push(`<path d="${combinedD}" fill="${color}" stroke="none" />`);
                });

                // 2. FRONT VIEW VECTOR SHADING
                shadingLayerElements.push(`<!-- Front View Vector Shading (Greys) -->`);
                let frontObjects = triangles
                  .map(tri => {
                    const normal = new THREE.Vector3();
                    tri.getNormal(normal);
                    const avgY = (tri.a.y + tri.b.y + tri.c.y) / 3;
                    const edge1 = new THREE.Vector3().subVectors(tri.b, tri.a);
                    const edge2 = new THREE.Vector3().subVectors(tri.c, tri.a);
                    const area = 0.5 * new THREE.Vector3().crossVectors(edge1, edge2).length();
                    return { tri, normal, avgY, area };
                  })
                  .filter(item => item.normal.y < 1e-4);

                if (frontObjects.length > 600) {
                  frontObjects.sort((a, b) => b.area - a.area);
                  frontObjects = frontObjects.slice(0, 600);
                }

                // Painter's Algorithm: highest avgY (back of front view) drawn first so closest faces are drawn last (on top)
                frontObjects.sort((a, b) => b.avgY - a.avgY);

                const frontColorPaths: { [color: string]: string[] } = {};

                frontObjects.forEach(item => {
                  const { tri, normal } = item;
                  const n_cam = new THREE.Vector3(normal.x, normal.z, -normal.y).normalize();
                  const intensity = n_cam.dot(lightDir);

                  let baseColor = "#FFFFFF";
                  if (intensity > 0.65) {
                    baseColor = "#FFFFFF";
                  } else if (intensity > 0.3) {
                    baseColor = "#F3F4F6";
                  } else if (intensity > -0.05) {
                    baseColor = "#E5E7EB";
                  } else if (intensity > -0.4) {
                    baseColor = "#D1D5DB";
                  } else {
                    baseColor = "#9CA3AF";
                  }

                  const ax = cx_2d + tri.a.x * pixels_per_mm;
                  const ay = cy_front - (tri.a.z - targetZ) * pixels_per_mm;
                  const bx = cx_2d + tri.b.x * pixels_per_mm;
                  const by = cy_front - (tri.b.z - targetZ) * pixels_per_mm;
                  const cx = cx_2d + tri.c.x * pixels_per_mm;
                  const cy = cy_front - (tri.c.z - targetZ) * pixels_per_mm;

                  const dSeg = `M ${ax.toFixed(2)} ${ay.toFixed(2)} L ${bx.toFixed(2)} ${by.toFixed(2)} L ${cx.toFixed(2)} ${cy.toFixed(2)} Z`;
                  if (!frontColorPaths[baseColor]) {
                    frontColorPaths[baseColor] = [];
                  }
                  frontColorPaths[baseColor].push(dSeg);
                });

                Object.keys(frontColorPaths).forEach(color => {
                  const combinedD = frontColorPaths[color].join(" ");
                  shadingLayerElements.push(`<path d="${combinedD}" fill="${color}" stroke="none" />`);
                });

                // 3. TOP VIEW TRUE VECTOR LINES (Collinear merging applied!)
                linesLayerElements.push(`<!-- Top View Vector Lines (Hidden Lines Removed) -->`);
                const topLinesRaw: Line2D[] = visibleTopSegments.map(seg => ({
                  x1: cx_2d + seg.start.x * pixels_per_mm,
                  y1: cy_top - seg.start.y * pixels_per_mm,
                  x2: cx_2d + seg.end.x * pixels_per_mm,
                  y2: cy_top - seg.end.y * pixels_per_mm
                }));
                const topLinesMerged = mergeCollinear2DLines(topLinesRaw, 1.0);
                topLinesMerged.forEach(l => {
                  linesLayerElements.push(`<line x1="${l.x1.toFixed(2)}" y1="${l.y1.toFixed(2)}" x2="${l.x2.toFixed(2)}" y2="${l.y2.toFixed(2)}" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>`);
                });

                // 4. FRONT VIEW TRUE VECTOR LINES (Collinear merging applied!)
                linesLayerElements.push(`<!-- Front View Vector Lines (Hidden Lines Removed) -->`);
                const frontLinesRaw: Line2D[] = visibleFrontSegments.map(seg => ({
                  x1: cx_2d + seg.start.x * pixels_per_mm,
                  y1: cy_front - (seg.start.z - targetZ) * pixels_per_mm,
                  x2: cx_2d + seg.end.x * pixels_per_mm,
                  y2: cy_front - (seg.end.z - targetZ) * pixels_per_mm
                }));
                const frontLinesMerged = mergeCollinear2DLines(frontLinesRaw, 1.0);
                frontLinesMerged.forEach(l => {
                  linesLayerElements.push(`<line x1="${l.x1.toFixed(2)}" y1="${l.y1.toFixed(2)}" x2="${l.x2.toFixed(2)}" y2="${l.y2.toFixed(2)}" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>`);
                });

              } else {
                // Fallback to raster lines and shading if modelMesh is missing
                shadingLayerElements.push(`<!-- Top View Shading (Greys) (Fallback) -->`);
                shadingLayerElements.push(`<image href="${rDataShading}" x="${cx_2d - tW_drawn / 2}" y="${cy_top - tH_drawn / 2}" width="${tW_drawn}" height="${tH_drawn}"/>`);

                shadingLayerElements.push(`<!-- Front View Shading (Greys) (Fallback) -->`);
                shadingLayerElements.push(`<image href="${fDataShading}" x="${cx_2d - fW_drawn / 2}" y="${cy_front - fH_drawn / 2}" width="${fW_drawn}" height="${fH_drawn}"/>`);

                linesLayerElements.push(`<!-- Top View Hidden-Line Overlay (Fallback) -->`);
                linesLayerElements.push(`<image href="${rDataLines}" x="${cx_2d - tW_drawn / 2}" y="${cy_top - tH_drawn / 2}" width="${tW_drawn}" height="${tH_drawn}"/>`);
                
                linesLayerElements.push(`<!-- Front View Hidden-Line Overlay (Fallback) -->`);
                linesLayerElements.push(`<image href="${fDataLines}" x="${cx_2d - fW_drawn / 2}" y="${cy_front - fH_drawn / 2}" width="${fW_drawn}" height="${fH_drawn}"/>`);
              }

              annotationLayerElements.push(`<text x="${cx_2d}" y="${cy_top + tH_drawn / 2 + 40}" fill="#1E293B" font-family="monospace" font-weight="bold" font-size="24" text-anchor="middle">${language === "cy" ? "Gwedd Dropsiwm (Top)" : "Top View"}</text>`);
              annotationLayerElements.push(`<text x="${cx_2d}" y="${cy_front + fH_drawn / 2 + 40}" fill="#1E293B" font-family="monospace" font-weight="bold" font-size="24" text-anchor="middle">${language === "cy" ? "Gwedd Blaen" : "Front View"}</text>`);

              // Vector Dimension Lines in the SVG
              const modelW_drawn = dimensions.x * pixels_per_mm;
              const modelH_drawn = dimensions.z * pixels_per_mm;
              const modelD_drawn = dimensions.y * pixels_per_mm;

              const addSvgDimensionLine = (x1: number, y1: number, x2: number, y2: number, textString: string, offsetValue: number, isVert: boolean) => {
                let dimX = x1;
                let dimY = y1;
                if (isVert) {
                  dimX = x1 - offsetValue;
                  annotationLayerElements.push(`<line x1="${dimX}" y1="${y1}" x2="${dimX}" y2="${y2}" stroke="#475569" stroke-width="2.5"/>`);
                  annotationLayerElements.push(`<line x1="${x1}" y1="${y1}" x2="${dimX - 15 * Math.sign(offsetValue)}" y2="${y1}" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="6,4"/>`);
                  annotationLayerElements.push(`<line x1="${x2}" y1="${y2}" x2="${dimX - 15 * Math.sign(offsetValue)}" y2="${y2}" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="6,4"/>`);
                  
                  const drawSvgArrow = (ax: number, ay: number, tox: number, toy: number) => {
                    const dx = tox - ax;
                    const dy = toy - ay;
                    const angle = Math.atan2(dy, dx);
                    const headlen = 15;
                    const pt1x = tox - headlen * Math.cos(angle - Math.PI / 6);
                    const pt1y = toy - headlen * Math.sin(angle - Math.PI / 6);
                    const pt2x = tox - headlen * Math.cos(angle + Math.PI / 6);
                    const pt2y = toy - headlen * Math.sin(angle + Math.PI / 6);
                    annotationLayerElements.push(`<polygon points="${tox},${toy} ${pt1x},${pt1y} ${pt2x},${pt2y}" fill="#475569" stroke="#475569"/>`);
                  };
                  drawSvgArrow(dimX, y1 + 15, dimX, y1);
                  drawSvgArrow(dimX, y2 - 15, dimX, y2);

                  const angleDeg = offsetValue > 0 ? 270 : 90;
                  const textX = dimX - 25 * Math.sign(offsetValue);
                  const textY = (y1 + y2) / 2;
                  annotationLayerElements.push(`<text x="${textX}" y="${textY}" fill="#475569" font-family="monospace" font-weight="bold" font-size="22" text-anchor="middle" transform="rotate(${angleDeg}, ${textX}, ${textY})">${textString}</text>`);
                } else {
                  dimY = y1 + offsetValue;
                  annotationLayerElements.push(`<line x1="${x1}" y1="${dimY}" x2="${x2}" y2="${dimY}" stroke="#475569" stroke-width="2.5"/>`);
                  annotationLayerElements.push(`<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${dimY + 15 * Math.sign(offsetValue)}" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="6,4"/>`);
                  annotationLayerElements.push(`<line x1="${x2}" y1="${y2}" x2="${x2}" y2="${dimY + 15 * Math.sign(offsetValue)}" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="6,4"/>`);

                  const drawSvgArrow = (ax: number, ay: number, tox: number, toy: number) => {
                    const dx = tox - ax;
                    const dy = toy - ay;
                    const angle = Math.atan2(dy, dx);
                    const headlen = 15;
                    const pt1x = tox - headlen * Math.cos(angle - Math.PI / 6);
                    const pt1y = toy - headlen * Math.sin(angle - Math.PI / 6);
                    const pt2x = tox - headlen * Math.cos(angle + Math.PI / 6);
                    const pt2y = toy - headlen * Math.sin(angle + Math.PI / 6);
                    annotationLayerElements.push(`<polygon points="${tox},${toy} ${pt1x},${pt1y} ${pt2x},${pt2y}" fill="#475569" stroke="#475569"/>`);
                  };
                  drawSvgArrow(x1 + 15, dimY, x1, dimY);
                  drawSvgArrow(x2 - 15, dimY, x2, dimY);

                  annotationLayerElements.push(`<text x="${(x1 + x2) / 2}" y="${dimY - 20 * Math.sign(offsetValue)}" fill="#475569" font-family="monospace" font-weight="bold" font-size="18" text-anchor="middle">${textString}</text>`);
                }
              };

              // Height (Z) on Front View
              const hX1 = cx_2d - modelW_drawn / 2;
              const hY1 = cy_front - modelH_drawn / 2;
              const hX2 = hX1;
              const hY2 = cy_front + modelH_drawn / 2;
              addSvgDimensionLine(hX1, hY1, hX2, hY2, `${dimensions.z.toFixed(1)} mm`, 85, true);

              // Width (X) on Front View
              const wX1 = cx_2d - modelW_drawn / 2;
              const wY1 = cy_front + modelH_drawn / 2;
              const wX2 = cx_2d + modelW_drawn / 2;
              const wY2 = wY1;
              addSvgDimensionLine(wX1, wY1, wX2, wY2, `${dimensions.x.toFixed(1)} mm`, 65, false);

              // Depth (Y) on Top View
              const dyX1 = cx_2d + modelW_drawn / 2;
              const dyY1 = cy_top - modelD_drawn / 2;
              const dyX2 = dyX1;
              const dyY2 = cy_top + modelD_drawn / 2;
              addSvgDimensionLine(dyX1, dyY1, dyX2, dyY2, `${dimensions.y.toFixed(1)} mm`, -75, true);
            }

            // Draw outer frame
            if (isFrame) {
              borderLayerElements.push(`<!-- Outer Frame border -->`);
              borderLayerElements.push(`<rect x="${leftMargin}" y="${topMargin}" width="${2970 - leftMargin - rightMargin}" height="${2100 - topMargin - bottomMargin}" fill="none" stroke="#000000" stroke-width="6"/>`);
            }

            // Draw Title Block
            if (isTitleBox) {
              const tbW = 1600;
              const tbH = 340;
              const tbX = 2970 - rightMargin - tbW - 6;
              const tbY = 2100 - bottomMargin - tbH - 6;

              borderLayerElements.push(`<!-- Title block -->`);
              borderLayerElements.push(`<rect x="${tbX}" y="${tbY}" width="${tbW}" height="${tbH}" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>`);
              borderLayerElements.push(`<line x1="${tbX + 250}" y1="${tbY + 85}" x2="${tbX + tbW}" y2="${tbY + 85}" stroke="#000000" stroke-width="2"/>`);
              borderLayerElements.push(`<line x1="${tbX + 250}" y1="${tbY + 170}" x2="${tbX + tbW}" y2="${tbY + 170}" stroke="#000000" stroke-width="2"/>`);
              borderLayerElements.push(`<line x1="${tbX + 250}" y1="${tbY + 255}" x2="${tbX + tbW}" y2="${tbY + 255}" stroke="#000000" stroke-width="2"/>`);
              borderLayerElements.push(`<line x1="${tbX + 250}" y1="${tbY}" x2="${tbX + 250}" y2="${tbY + tbH}" stroke="#000000" stroke-width="2"/>`);
              borderLayerElements.push(`<line x1="${tbX + 1000}" y1="${tbY + 85}" x2="${tbX + 1000}" y2="${tbY + tbH}" stroke="#000000" stroke-width="2"/>`);

              // Logo Image
              borderLayerElements.push(`<image href="${logoBase64 || logoUrl}" x="${tbX + (250 - 200) / 2}" y="${tbY + (340 - 160) / 2}" width="200" height="160"/>`);

              let finalDispName = customEvent.detail?.fileName || "extruder_model";
              if (finalDispName.length > 25) finalDispName = finalDispName.substring(0, 23) + "...";

              const labelSheet = language === "cy" ? "DALEN" : "SHEET";
              const labelDate = language === "cy" ? "DYDDIAD" : "DATE";
              const labelVol = language === "cy" ? "CYFAINT" : "VOLUME";
              const labelScale = language === "cy" ? "GRADDFA" : "SCALE";
              const labelDim = language === "cy" ? "MESURAU" : "DIM.";
              const labelDes = language === "cy" ? "CYNLLUNYDD" : "BY";

              const dateStr = isDate 
                ? new Date().toLocaleDateString(language === "cy" ? "cy-GB" : "en-GB", { year: 'numeric', month: 'short', day: 'numeric' })
                : "-";

              // Row 1
              borderLayerElements.push(`<text x="${tbX + 270}" y="${tbY + 56}" fill="#000000" font-family="sans-serif" font-weight="bold" font-size="44" text-anchor="start">${finalDispName.toUpperCase()}</text>`);

              // Row 2
              borderLayerElements.push(`<text x="${tbX + 270}" y="${tbY + 141}" font-family="monospace" font-weight="bold" font-size="42" text-anchor="start"><tspan fill="#000000">${labelSheet}: </tspan><tspan fill="#000000">A4</tspan></text>`);
              borderLayerElements.push(`<text x="${tbX + 1020}" y="${tbY + 141}" font-family="monospace" font-weight="bold" font-size="42" text-anchor="start"><tspan fill="#000000">${labelDate}: </tspan><tspan fill="#000000">${dateStr}</tspan></text>`);

              // Row 3
              borderLayerElements.push(`<text x="${tbX + 270}" y="${tbY + 226}" font-family="monospace" font-weight="bold" font-size="42" text-anchor="start"><tspan fill="#000000">${labelVol}: </tspan><tspan fill="#000000">${(volume / 1000).toFixed(2)} cm³</tspan></text>`);
              borderLayerElements.push(`<text x="${tbX + 1020}" y="${tbY + 226}" font-family="monospace" font-weight="bold" font-size="42" text-anchor="start"><tspan fill="#000000">${labelScale}: </tspan><tspan fill="#000000">${scaleLabelLabel}</tspan></text>`);

              // Row 4
              borderLayerElements.push(`<text x="${tbX + 270}" y="${tbY + 311}" font-family="monospace" font-weight="bold" font-size="42" text-anchor="start"><tspan fill="#000000">${labelDim}: </tspan><tspan fill="#000000">${dimensions.x.toFixed(1)}x${dimensions.y.toFixed(1)}x${dimensions.z.toFixed(1)}mm</tspan></text>`);
              borderLayerElements.push(`<text x="${tbX + 1020}" y="${tbY + 311}" font-family="monospace" font-weight="bold" font-size="42" text-anchor="start"><tspan fill="#000000">${labelDes}: </tspan><tspan fill="#000000">${designerName || "-"}</tspan></text>`);
            }

            const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 297 210" width="297mm" height="210mm" style="overflow: hidden;">
  <desc>Technical Drawing for ${finalFileName}</desc>
  <style>
    text { font-family: monospace, sans-serif; }
  </style>
  <g transform="scale(0.1)">
    ${bgElements.join("\n")}
    
    <g id="Layer_2D_Shading" inkscape:groupmode="layer" inkscape:label="2D Projections - Shading">
      ${shadingLayerElements.join("\n")}
    </g>

    <g id="Layer_2D_Black_Lines" inkscape:groupmode="layer" inkscape:label="2D Projections - Black Lines">
      ${linesLayerElements.join("\n")}
    </g>

    <g id="Layer_3D_Isometric" inkscape:groupmode="layer" inkscape:label="3D Isometric View">
      ${isometricLayerElements.join("\n")}
    </g>

    <g id="Layer_Borders_TitleBlock" inkscape:groupmode="layer" inkscape:label="Borders and Title Block">
      ${borderLayerElements.join("\n")}
    </g>

    <g id="Layer_Annotations_Dimensions" inkscape:groupmode="layer" inkscape:label="Annotations and Dimensions">
      ${annotationLayerElements.join("\n")}
    </g>
  </g>
</svg>`;
            const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `${finalFileName}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          } else if (format === "png") {
            const drawingURL = canvas2D.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `${finalFileName}.png`;
            link.href = drawingURL;
            link.click();
          } else {
            // Default to JPEG
            const drawingURL = canvas2D.toDataURL("image/jpeg", 0.98);
            const link = document.createElement("a");
            link.download = `${finalFileName}.jpg`;
            link.href = drawingURL;
            link.click();
          }
        }
      };

      buildCompositeCanvas();
    };

    const handleScreenshotWrapped = (e: Event) => handleScreenshot(e);
    window.addEventListener("export-picture", handleScreenshotWrapped);
    window.dispatchEvent(new CustomEvent("screenshot-exporter-ready"));
    return () =>
      window.removeEventListener("export-picture", handleScreenshotWrapped);
  }, [gl, scene, camera, params, volume, dimensions, language]);
  return null;
}

function generateHollowGeometry(
  params: ModelParams,
  settings: PrinterSettings,
): THREE.BufferGeometry {
  if (params.cubeMode) {
    const cx = params.cubeX ?? 20;
    const cy = params.cubeY ?? 20;
    const cz = params.cubeZ ?? 20;

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    const hX = cx / 2;
    const hY = cy / 2;

    // Bottom vertices (z = 0)
    vertices.push(-hX, -hY, 0);
    vertices.push(hX, -hY, 0);
    vertices.push(hX, hY, 0);
    vertices.push(-hX, hY, 0);

    // Top vertices (z = cz)
    vertices.push(-hX, -hY, cz);
    vertices.push(hX, -hY, cz);
    vertices.push(hX, hY, cz);
    vertices.push(-hX, hY, cz);

    // Bottom face
    indices.push(0, 2, 1);
    indices.push(0, 3, 2);
    indices.push(0, 1, 2);
    indices.push(0, 2, 3);

    // Side 1: Front
    indices.push(0, 1, 5);
    indices.push(0, 5, 4);

    // Side 2: Right
    indices.push(1, 2, 6);
    indices.push(1, 6, 5);

    // Side 3: Back
    indices.push(2, 3, 7);
    indices.push(2, 7, 6);

    // Side 4: Left
    indices.push(3, 0, 4);
    indices.push(3, 4, 7);

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  if (params.height <= 0 || params.radius <= 0 || params.sides < 1) {
    return new THREE.BufferGeometry();
  }
  const layers = Math.ceil(params.height / settings.layerHeight);
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  // 1. Generate Vertices
  for (let i = 0; i <= layers; i++) {
    const progress = layers > 0 ? i / layers : 0;
    const layerPoints = getLayerPoints(params, progress);
    for (const p of layerPoints) {
      vertices.push(p.x, p.y, p.z);
    }
  }

  const pointsPerLayer = getLayerPoints(params, 0).length;

  // 2. Generate Indices
  for (let i = 0; i < layers; i++) {
    for (let j = 0; j < pointsPerLayer - 1; j++) {
      const currentLayer = i * pointsPerLayer;
      const nextLayer = (i + 1) * pointsPerLayer;

      const a = currentLayer + j;
      const b = currentLayer + j + 1;
      const c = nextLayer + j + 1;
      const d = nextLayer + j;

      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  // 3. Bottom Cap
  const centerIndex = vertices.length / 3;
  vertices.push(0, 0, 0);
  for (let j = 0; j < pointsPerLayer - 1; j++) {
    const a = j;
    const b = j + 1;
    indices.push(centerIndex, b, a);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function SmileyRaycaster({ activeTab }: { activeTab: string }) {
  const { camera, raycaster, scene } = useThree();
  const dragCoordsRef = useRef<{ clientX: number; clientY: number } | null>(
    null,
  );
  const wasDraggingRef = useRef(false);

  useEffect(() => {
    const handleDragMove = (e: any) => {
      if (e.detail?.isDragging) {
        dragCoordsRef.current = {
          clientX: e.detail.clientX,
          clientY: e.detail.clientY,
        };
      } else {
        dragCoordsRef.current = null;
      }
    };

    window.addEventListener("smiley-drag-move", handleDragMove);
    return () => window.removeEventListener("smiley-drag-move", handleDragMove);
  }, []);

  useFrame((state) => {
    const coords = dragCoordsRef.current;
    if (!coords) {
      if (wasDraggingRef.current) {
        window.dispatchEvent(
          new CustomEvent("smiley-raycast-hit", { detail: { hitType: null } }),
        );
        wasDraggingRef.current = false;
      }
      return;
    }
    wasDraggingRef.current = true;

    const { gl } = state;
    const rect = gl.domElement.getBoundingClientRect();

    // Calculate normalized device coordinates
    const x = ((coords.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((coords.clientY - rect.top) / rect.height) * 2 + 1;

    // Use a forgiving threshold for lines/points coordinates to make hover comfortable
    if (raycaster.params.Line) {
      raycaster.params.Line.threshold = 12;
    }

    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    let hitType: "model" | "gcode" | null = null;

    if (activeTab === "model") {
      const targetObj = scene.getObjectByName("extruded-model");
      if (targetObj) {
        const intersects = raycaster.intersectObject(targetObj, true);
        if (intersects.length > 0) {
          hitType = "model";
        }
      }
    } else if (activeTab === "gcode") {
      const helperLine = scene.getObjectByName("gcode-path-raycast-helper");
      const targetLine = scene.getObjectByName("gcode-path-line");
      const targetMesh = scene.getObjectByName("gcode-path-mesh");
      const targetJointMesh = scene.getObjectByName("gcode-path-joint-mesh");

      let intersects: any[] = [];
      if (helperLine) {
        intersects = raycaster.intersectObject(helperLine, true);
      }
      if (intersects.length === 0 && targetLine) {
        intersects = raycaster.intersectObject(targetLine, true);
      }
      if (intersects.length === 0 && targetMesh) {
        intersects = raycaster.intersectObject(targetMesh, true);
      }
      if (intersects.length === 0 && targetJointMesh) {
        intersects = raycaster.intersectObject(targetJointMesh, true);
      }

      if (intersects.length > 0) {
        hitType = "gcode";
      }
    }

    window.dispatchEvent(
      new CustomEvent("smiley-raycast-hit", { detail: { hitType } }),
    );
  });

  return null;
}

export const ModelViewer = memo(function ModelViewer({
  params: rawParams,
  settings,
  gcode,
  mode = "model",
  activeTab = "model",
  isCalculating = false,
  isGcodeStale = false,
  calcProgress = 0,
  onExportGCode,
  playhead = 0,
  viewMode = "path",
  language = "en",
  highlightedSection = null,
  isStlPreviewOn = false,
  is3mfPreviewOn = false,
  stlThickness = 1.2,
  showA4Sheet = false,
  isTechDrawingActive = false,
  techDrawingPreviewUrl = null,
  initialGrid,
  initialBasePlate,
  initialAxis,
  initialBuildVolume,
}: {
  params: ModelParams;
  settings: PrinterSettings;
  gcode?: string;
  mode?: "model" | "gcode";
  activeTab?: string;
  isCalculating?: boolean;
  isGcodeStale?: boolean;
  calcProgress?: number;
  onExportGCode?: () => void;
  playhead?: number;
  viewMode?: "path" | "material";
  language?: "en" | "cy";
  highlightedSection?: string | null;
  isStlPreviewOn?: boolean;
  is3mfPreviewOn?: boolean;
  stlThickness?: number | null;
  showA4Sheet?: boolean;
  isTechDrawingActive?: boolean;
  techDrawingPreviewUrl?: string | null;
  initialGrid?: boolean;
  initialBasePlate?: boolean;
  initialAxis?: boolean;
  initialBuildVolume?: boolean;
}) {
  const modelScale = (settings.scale !== undefined && settings.scale > 0) ? settings.scale : 1.0;
  const effectiveTextureType = (settings.enableTexture !== undefined ? settings.enableTexture : false)
    ? rawParams.textureType
    : TextureType.NONE;

  const params: ModelParams = useMemo(() => {
    if (modelScale === 1.0 && effectiveTextureType === rawParams.textureType) {
      return rawParams;
    }
    return {
      ...rawParams,
      textureType: effectiveTextureType,
      radius: rawParams.radius * modelScale,
      height: rawParams.height * modelScale,
      bulge: rawParams.bulge * modelScale,
      neckSize: rawParams.neckSize * modelScale,
      cornerRadius: rawParams.cornerRadius * modelScale,
      cubeX: (rawParams.cubeX ?? 30) * modelScale,
      cubeY: (rawParams.cubeY ?? 30) * modelScale,
      cubeZ: (rawParams.cubeZ ?? 30) * modelScale,
    };
  }, [rawParams, modelScale, effectiveTextureType]);

  const [showCoordinateSystem, setShowCoordinateSystem] = useState(
    initialAxis !== undefined ? initialAxis : true
  );
  const [showStatus, setShowStatus] = useState(false);
  const calcStartTimeRef = useRef<number>(0);
  const [isSmileyOver, setIsSmileyOver] = useState(false);
  const [currentView, setCurrentView] = useState<
    "perspective" | "top" | "front" | "right" | null
  >("perspective");

  const stlGeometry = useMemo(() => {
    if (!isStlPreviewOn && !is3mfPreviewOn) return null;
    try {
      if (
        stlThickness !== null &&
        stlThickness !== undefined &&
        stlThickness > 0
      ) {
        return generateSolidGeometry(params, settings, stlThickness);
      } else {
        return generateHollowGeometry(params, settings);
      }
    } catch (err) {
      console.error("Failed to generate preview STL geometry: ", err);
      return null;
    }
  }, [isStlPreviewOn, is3mfPreviewOn, params, settings, stlThickness]);

  useEffect(() => {
    const handleSmileyOver = (e: any) => {
      setIsSmileyOver(!!e.detail?.isOver);
    };
    const handleDropViews3D = () => setView("perspective");
    const handleDropViewsTop = () => setView("top");
    const handleDropViewsFront = () => setView("front");
    const handleDropViewsRight = () => setView("right");
    const handleDropGrid = () => {};
    const handleDropBaseplate = () => {};
    const handleDropAxis = () => {};
    const handleDropBuildvolume = () => {};

    window.addEventListener("smiley-over-view-window", handleSmileyOver);
    window.addEventListener("smiley-drop-views-3d", handleDropViews3D);
    window.addEventListener("smiley-drop-views-top", handleDropViewsTop);
    window.addEventListener("smiley-drop-views-front", handleDropViewsFront);
    window.addEventListener("smiley-drop-views-right", handleDropViewsRight);
    window.addEventListener("smiley-drop-views", handleDropViews3D);
    window.addEventListener("smiley-drop-grid", handleDropGrid);
    window.addEventListener("smiley-drop-baseplate", handleDropBaseplate);
    window.addEventListener("smiley-drop-axis", handleDropAxis);
    window.addEventListener("smiley-drop-buildvolume", handleDropBuildvolume);

    return () => {
      window.removeEventListener("smiley-over-view-window", handleSmileyOver);
      window.removeEventListener("smiley-drop-views-3d", handleDropViews3D);
      window.removeEventListener("smiley-drop-views-top", handleDropViewsTop);
      window.removeEventListener(
        "smiley-drop-views-front",
        handleDropViewsFront,
      );
      window.removeEventListener(
        "smiley-drop-views-right",
        handleDropViewsRight,
      );
      window.removeEventListener("smiley-drop-views", handleDropViews3D);
      window.removeEventListener("smiley-drop-grid", handleDropGrid);
      window.removeEventListener("smiley-drop-baseplate", handleDropBaseplate);
      window.removeEventListener("smiley-drop-axis", handleDropAxis);
      window.removeEventListener(
        "smiley-drop-buildvolume",
        handleDropBuildvolume,
      );
    };
  }, []);

  // Centralized STL and 3MF Export handlers working in any mode/visibility state
  useEffect(() => {
    const handleExport = (e: any) => {
      const thickness = e.detail?.thickness;
      const fileName = e.detail?.fileName || "model.stl";
      try {
        const geom =
          thickness && thickness > 0
            ? generateSolidGeometry(params, settings, thickness)
            : generateHollowGeometry(params, settings);

        const tempMesh = new THREE.Mesh(geom);
        exportToSTL(tempMesh, fileName);
        geom.dispose();
      } catch (err) {
        console.error("Failed to export STL: ", err);
      }
    };
    window.addEventListener("export-stl", handleExport);
    return () => window.removeEventListener("export-stl", handleExport);
  }, [params, settings]);

  useEffect(() => {
    const handleExport3MF = (e: any) => {
      const thickness = e.detail?.thickness;
      const fileName = e.detail?.fileName || "model.3mf";
      try {
        const geom =
          thickness && thickness > 0
            ? generateSolidGeometry(params, settings, thickness)
            : generateHollowGeometry(params, settings);

        exportTo3MF(geom, fileName);
        geom.dispose();
      } catch (err) {
        console.error("Failed to export 3MF: ", err);
      }
    };
    window.addEventListener("export-3mf", handleExport3MF);
    return () => window.removeEventListener("export-3mf", handleExport3MF);
  }, [params, settings]);

  // Status visibility logic: at least 1s
  useEffect(() => {
    if (isCalculating) {
      if (!showStatus) {
        setShowStatus(true);
        calcStartTimeRef.current = Date.now();
      }
    } else if (showStatus) {
      const elapsed = Date.now() - calcStartTimeRef.current;
      const delay = Math.max(0, 1000 - elapsed);
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isCalculating, showStatus]);

  const [importedGeometry, setImportedGeometry] =
    useState<THREE.BufferGeometry | null>(null);
  const controlsRef = useRef<any>(null);
  const miniCameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const setView = (view: "perspective" | "top" | "front" | "right") => {
    if (!controlsRef.current) return;
    setCurrentView(view);

    const controls = controlsRef.current;
    const camera = controls.object;
    const target = new THREE.Vector3(0, 0, params.height / 2);

    controls.target.copy(target);

    switch (view) {
      case "perspective":
        camera.up.set(0, 0, 1);
        if (isTechDrawingActive) {
          camera.position.set(300, -300, params.height / 2 + 240);
        } else {
          camera.position.set(200, -200, 200);
        }
        break;
      case "top":
        camera.up.set(0, 1, 0);
        camera.position.set(0, 0, 500);
        break;
      case "front":
        camera.up.set(0, 0, 1);
        camera.position.set(0, -400, params.height / 2);
        break;
      case "right":
        camera.up.set(0, 0, 1);
        camera.position.set(400, 0, params.height / 2);
        break;
    }

    controls.update();
  };

  useEffect(() => {
    const handleImport = (e: any) => {
      const url = e.detail.url;
      const loader = new STLLoader();
      loader.load(url, (geometry) => {
        geometry.computeVertexNormals();
        setImportedGeometry(geometry);
        URL.revokeObjectURL(url);
      });
    };
    window.addEventListener("import-stl", handleImport);
    return () => window.removeEventListener("import-stl", handleImport);
  }, []);

  const { points, totalDistance, cumulativeDistances, extrudingSegments } =
    useMemo(() => {
      if (!gcode)
        return {
          points: [],
          totalDistance: 0,
          cumulativeDistances: [],
          extrudingSegments: [],
        };
      const lines = gcode.split("\n");
      const path: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
      const distances: number[] = [0];
      const extrusion: boolean[] = [];
      let curX = 0,
        curY = 0,
        curZ = 0,
        curE = 0;
      let isRelative = false;
      let isRelativeE = false;
      let totalD = 0;

      lines.forEach((line, index) => {
        // Still skip first line as it's often a comment or empty
        if (index === 0 && !line.trim()) return;

        // Skip image thumbnail rows
        const upperLine = line.trim().toUpperCase();
        if (upperLine.startsWith(";SIMAGE:") || upperLine.startsWith("M10086")) {
          return;
        }

        const trimmed = line.split(";")[0].trim().toUpperCase(); // Remove comments
        if (!trimmed) return;

        if (trimmed.startsWith("G90")) isRelative = false;
        else if (trimmed.startsWith("G91")) isRelative = true;
        else if (trimmed.startsWith("M82")) isRelativeE = false;
        else if (trimmed.startsWith("M83")) isRelativeE = true;

        const isMove = trimmed.startsWith("G0") || trimmed.startsWith("G1");

        if (isMove) {
          const xMatch = trimmed.match(/X\s*(-?\d*\.?\d+)/);
          const yMatch = trimmed.match(/Y\s*(-?\d*\.?\d+)/);
          const zMatch = trimmed.match(/Z\s*(-?\d*\.?\d+)/);
          const eMatch = trimmed.match(/E\s*(-?\d*\.?\d+)/);

          const valX = xMatch ? parseFloat(xMatch[1]) : isRelative ? 0 : curX;
          const valY = yMatch ? parseFloat(yMatch[1]) : isRelative ? 0 : curY;
          const valZ = zMatch ? parseFloat(zMatch[1]) : isRelative ? 0 : curZ;
          const valE = eMatch ? parseFloat(eMatch[1]) : isRelativeE ? 0 : curE;

          const nextX = isRelative ? curX + valX : valX;
          const nextY = isRelative ? curY + valY : valY;
          const nextZ = isRelative ? curZ + valZ : valZ;
          const nextE = isRelativeE ? curE + valE : valE;

          const isExtruding = trimmed.startsWith("G1") && nextE > curE;

          const dist = Math.sqrt(
            Math.pow(nextX - curX, 2) +
              Math.pow(nextY - curY, 2) +
              Math.pow(nextZ - curZ, 2),
          );
          if (!isNaN(dist)) {
            totalD += dist;
            curX = nextX;
            curY = nextY;
            curZ = nextZ;
            curE = nextE;

            path.push(new THREE.Vector3(curX, curY, curZ));
            distances.push(totalD);
            extrusion.push(isExtruding);
          }
        } else {
          // Non-move lines still advance progress slightly
          totalD += 0.05;
          path.push(new THREE.Vector3(curX, curY, curZ));
          distances.push(totalD);
          extrusion.push(false);
        }
      });

      return {
        points: path,
        totalDistance: totalD,
        cumulativeDistances: distances,
        extrudingSegments: extrusion,
      };
    }, [gcode]);

  const volume = useMemo(
    () => calculateModelVolume(params, settings),
    [params, settings],
  );

  const dimensions = useMemo(() => {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    // Sample 21 layers for an accurate bounding box envelope
    for (let i = 0; i <= 20; i++) {
      const progress = i / 20;
      const points = getLayerPoints(params, progress);
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      }
    }

    // Fallbacks if points are empty or invalid
    if (minX === Infinity) {
      return {
        x: Math.round(params.radius * 2),
        y: Math.round(params.radius * 2),
        z: Math.round(params.height),
      };
    }

    return {
      x: Math.round((maxX - minX) * 10) / 10,
      y: Math.round((maxY - minY) * 10) / 10,
      z: Math.round((maxZ - minZ) * 10) / 10,
    };
  }, [params]);

  const isometricBox = useMemo(() => {
    const maxDim = Math.max(dimensions.x, dimensions.y, dimensions.z);
    const isoSizeMm = maxDim * 1.35 + 12;

    const standardScales = [
      { label: "5:1", factor: 5.0 },
      { label: "2:1", factor: 2.0 },
      { label: "1:1", factor: 1.0 },
      { label: "1:2", factor: 0.5 },
      { label: "1:5", factor: 0.2 },
      { label: "1:10", factor: 0.1 },
      { label: "1:20", factor: 0.05 },
      { label: "1:50", factor: 0.02 },
    ];

    const safeScale = standardScales.find(s => {
      const f = s.factor;
      const p_mm = f * 10;
      const fHMm = dimensions.z + 10;
      const tHMm = dimensions.y + 10;
      const fWMm = dimensions.x + 10;
      const tWMm = dimensions.x + 10;

      const totalDrawnHeight = (tHMm + fHMm) * p_mm;
      const vFit = totalDrawnHeight <= 1700;

      const totalDrawnWidth = (Math.max(tWMm, fWMm) + isoSizeMm) * p_mm;
      const hFit = totalDrawnWidth <= 2400;

      return vFit && hFit;
    });

    const bestScale = safeScale || standardScales[standardScales.length - 1];
    const finalScaleFactor = bestScale.factor;
    const pixels_per_mm = finalScaleFactor * 10;

    const topWidthMm = dimensions.x;
    const topHeightMm = dimensions.y;
    const frontWidthMm = dimensions.x;
    const frontHeightMm = dimensions.z;

    const tW_drawn = topWidthMm * pixels_per_mm;
    const tH_drawn = topHeightMm * pixels_per_mm;
    const fW_drawn = frontWidthMm * pixels_per_mm;
    const fH_drawn = frontHeightMm * pixels_per_mm;
    const pW_drawn = isoSizeMm * pixels_per_mm;

    const max2DWidth = Math.max(tW_drawn, fW_drawn);
    const W_3d = pW_drawn;

    const isFrame = true;
    const leftMargin = isFrame ? 150 : 75;
    const rightMargin = 75;

    const startX = leftMargin;
    const endX = 2970 - rightMargin;
    const totalWidthAvailable = endX - startX;

    const equalGap = (totalWidthAvailable - max2DWidth - W_3d) / 3;

    const cx_3d = endX - equalGap - W_3d / 2;
    const cy_3d = 850;

    const left = ((cx_3d - pW_drawn / 2) / 2970) * 100;
    const top = ((cy_3d - pW_drawn / 2) / 2100) * 100;
    const width = (pW_drawn / 2970) * 100;
    const height = (pW_drawn / 2100) * 100;

    return { left, top, width, height };
  }, [dimensions]);

  const majorTickMarks = [-100, -50, 50, 100];
  const minorTickMarks = useMemo(() => {
    const marks = [];
    for (let i = -120; i <= 120; i += 10) {
      if (i !== 0 && !majorTickMarks.includes(i)) marks.push(i);
    }
    return marks;
  }, []);

  const majorZTickMarks = [50, 100, 150, 200, 250];
  const minorZTickMarks = useMemo(() => {
    const marks = [];
    for (let i = 10; i <= 250; i += 10) {
      if (!majorZTickMarks.includes(i)) marks.push(i);
    }
    return marks;
  }, []);

  const [showGrid, setShowGrid] = useState(
    initialGrid !== undefined ? initialGrid : true
  );
  const [showBasePlate, setShowBasePlate] = useState(
    initialBasePlate !== undefined ? initialBasePlate : true
  );
  const [showLogos, setShowLogos] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showBuildVolume, setShowBuildVolume] = useState(
    initialBuildVolume !== undefined ? initialBuildVolume : true
  );

  useEffect(() => {
    if (initialGrid !== undefined) setShowGrid(initialGrid);
  }, [initialGrid]);

  useEffect(() => {
    if (initialBasePlate !== undefined) setShowBasePlate(initialBasePlate);
  }, [initialBasePlate]);

  useEffect(() => {
    if (initialAxis !== undefined) setShowCoordinateSystem(initialAxis);
  }, [initialAxis]);

  useEffect(() => {
    if (initialBuildVolume !== undefined) setShowBuildVolume(initialBuildVolume);
  }, [initialBuildVolume]);

  const [isViewsExpanded, setIsViewsExpanded] = useState(false);
  const [isModelExpanded, setIsModelExpanded] = useState(true);

  // Reset camera when entering technical drawing preview mode
  useEffect(() => {
    if (isTechDrawingActive && controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object;
      const targetZ = params.height / 2;
      camera.up.set(0, 0, 1);
      camera.position.set(300, -300, targetZ + 240);
      controls.target.set(0, 0, targetZ);
      controls.update();
      setCurrentView("perspective");
    }
  }, [isTechDrawingActive, params.height]);

  // Synchronize layout element view-defaults when changing active tab
  useEffect(() => {
    if (activeTab === "gcode") {
      setShowGrid(true);
      setShowBasePlate(true);
      setShowLogos(true);
      setShowBuildVolume(true);
      setShowCoordinateSystem(true);
    } else if (activeTab === "save") {
      // Deactivate grid, base plate, axis, and build volume in save/3dprint mode
      setShowGrid(false);
      setShowBasePlate(false);
      setShowCoordinateSystem(false);
      setShowBuildVolume(false);
      setShowLogos(false);
    }
  }, [activeTab]);

  // Synchronize view expand state when smiley hovers over it
  useEffect(() => {
    if (
      highlightedSection === "subsec_3d_view_control_hover" ||
      highlightedSection === "subsec_3d_view_control_3d_hover" ||
      highlightedSection === "subsec_3d_view_control_top_hover" ||
      highlightedSection === "subsec_3d_view_control_front_hover" ||
      highlightedSection === "subsec_3d_view_control_right_hover" ||
      highlightedSection === "subsec-3d-view-control"
    ) {
      setIsViewsExpanded(true);
    }
  }, [highlightedSection]);

  // Synchronize view controls to drawing generator before entering preview
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('view-controls-sync', {
      detail: {
        grid: showGrid,
        basePlate: showBasePlate,
        axis: showCoordinateSystem,
        buildVolume: showBuildVolume,
      }
    }));
  }, [showGrid, showBasePlate, showCoordinateSystem, showBuildVolume]);

  return (
    <div 
      className={`w-full h-full relative flex flex-col overflow-hidden transition-all duration-300 ${
        showA4Sheet 
          ? "bg-[#0F172A] p-4 justify-between items-center" 
          : "bg-[radial-gradient(ellipse_at_center,_#FFFFFF_0%,_#D2D6D9_55%,_#A1A6A9_100%)]"
      }`}
    >
      {/* Volume and View Display */}
      <div 
        className={`absolute z-30 flex flex-col gap-1.5 items-end transition-all ${
          showA4Sheet 
            ? "top-16 right-6" 
            : "top-3 right-3"
        }`}
      >
        {/* View Presets */}
        <div
          id="subsec-view-control-container"
          className={`bg-[#7F7F7F] p-1.5 rounded-xl border flex flex-col gap-0.5 pointer-events-auto transition-all duration-300 ${isViewsExpanded ? "w-44" : "w-[85px]"} ${
            highlightedSection === "subsec_3d_view_control_hover" ||
            highlightedSection === "subsec_3d_view_control_3d_hover" ||
            highlightedSection === "subsec_3d_view_control_top_hover" ||
            highlightedSection === "subsec_3d_view_control_front_hover" ||
            highlightedSection === "subsec_3d_view_control_right_hover" ||
            highlightedSection === "subsec-3d-view-control" ||
            highlightedSection === "subsec-view-control"
              ? "border-[#404040] bg-[#7F7F7F] ring-4 ring-white/40 scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.25)] z-50"
              : "border-[#404040] shadow-[0_0_12px_rgba(0,0,0,0.15)]"
          }`}
        >
          <button
            id="subsec-view-item-views"
            onClick={() => setIsViewsExpanded(!isViewsExpanded)}
            className="p-1.5 text-white hover:bg-[#7F7F7F]/90 rounded-lg transition-all flex items-center gap-2 w-full group overflow-hidden"
          >
            <Box className="w-3.5 h-3.5 shrink-0 text-white" />
            <span className="text-[9px] font-black uppercase tracking-tight text-white whitespace-nowrap">
              {language === "cy" ? "Golwg" : "View"}
            </span>
            <AnimatePresence>
              {isViewsExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-[9px] font-black uppercase tracking-tight text-white whitespace-nowrap"
                >
                  {language === "cy" ? "Rheolyddion" : "Controls"}
                </motion.span>
              )}
            </AnimatePresence>
            {isViewsExpanded && (
              <ChevronRight className="w-3 h-3 ml-auto shrink-0 text-white" />
            )}
          </button>

          <AnimatePresence>
            {isViewsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col gap-0.5"
              >
                <div className="h-[1px] bg-white/10 my-1 mx-1" />

                <TooltipProvider delay={200}>
                  {(() => {
                    const isAllHighlighted =
                      highlightedSection === "subsec_3d_view_control_hover" ||
                      highlightedSection === "subsec-3d-view-control";
                    const is3DHighlighted =
                      (currentView as string) === "perspective" ||
                      highlightedSection ===
                        "subsec_3d_view_control_3d_hover" ||
                      (highlightedSection === "subsec-3d-view-control" &&
                        (currentView as string) === "perspective") ||
                      isAllHighlighted;
                    const isTopHighlighted =
                      (currentView as string) === "top" ||
                      highlightedSection ===
                        "subsec_3d_view_control_top_hover" ||
                      (highlightedSection === "subsec-3d-view-control" &&
                        (currentView as string) === "top") ||
                      isAllHighlighted;
                    const isFrontHighlighted =
                      (currentView as string) === "front" ||
                      highlightedSection ===
                        "subsec_3d_view_control_front_hover" ||
                      (highlightedSection === "subsec-3d-view-control" &&
                        (currentView as string) === "front") ||
                      isAllHighlighted;
                    const isRightHighlighted =
                      (currentView as string) === "right" ||
                      highlightedSection ===
                        "subsec_3d_view_control_right_hover" ||
                      (highlightedSection === "subsec-3d-view-control" &&
                        (currentView as string) === "right") ||
                      isAllHighlighted;

                    return (
                      <>
                        <Tooltip>
                          <TooltipTrigger
                            id="subsec-view-item-view-3d"
                            onClick={() => setView("perspective")}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2.5 w-full group text-left ${
                              is3DHighlighted
                                ? "bg-white/20 text-white border border-white/30 font-bold ring-2 ring-white/25 scale-[1.02]"
                                : "text-white/80 hover:bg-white/10"
                            }`}
                          >
                            <Box className="w-3.5 h-3.5 text-white" />
                            <span
                              className={`text-[9px] uppercase tracking-tight ${is3DHighlighted ? "text-white font-black" : "text-white/80 group-hover:text-white font-black"}`}
                            >
                              {language === "cy" ? "Golwg 3D" : "3D View"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="text-[9px] font-bold uppercase tracking-widest bg-slate-900 border-none text-white px-2 py-1"
                          >
                            {language === "cy" ? "Persbectif" : "Perspective"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            id="subsec-view-item-view-top"
                            onClick={() => setView("top")}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2.5 w-full group text-left ${
                              isTopHighlighted
                                ? "bg-white/20 text-white border border-white/30 font-bold ring-2 ring-white/25 scale-[1.02]"
                                : "text-white/80 hover:bg-white/10"
                            }`}
                          >
                            <Square className="w-3.5 h-3.5 text-white" />
                            <span
                              className={`text-[9px] uppercase tracking-tight ${isTopHighlighted ? "text-white font-black" : "text-white/80 group-hover:text-white font-black"}`}
                            >
                              {language === "cy" ? "Golwg Uchaf" : "Top View"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="text-[9px] font-bold uppercase tracking-widest bg-slate-900 border-none text-white px-2 py-1"
                          >
                            {language === "cy" ? "Uchaf" : "Top"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            id="subsec-view-item-view-front"
                            onClick={() => setView("front")}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2.5 w-full group text-left ${
                              isFrontHighlighted
                                ? "bg-white/20 text-white border border-white/30 font-bold ring-2 ring-white/25 scale-[1.02]"
                                : "text-white/80 hover:bg-white/10"
                            }`}
                          >
                            <RectangleHorizontal className="w-3.5 h-3.5 text-white" />
                            <span
                              className={`text-[9px] uppercase tracking-tight ${isFrontHighlighted ? "text-white font-black" : "text-white/80 group-hover:text-white font-black"}`}
                            >
                              {language === "cy" ? "Golwg Blaen" : "Front View"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="text-[9px] font-bold uppercase tracking-widest bg-slate-900 border-none text-white px-2 py-1"
                          >
                            {language === "cy" ? "Blaen" : "Front"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            id="subsec-view-item-view-right"
                            onClick={() => setView("right")}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2.5 w-full group text-left ${
                              isRightHighlighted
                                ? "bg-white/20 text-white border border-white/30 font-bold ring-2 ring-white/25 scale-[1.02]"
                                : "text-white/80 hover:bg-white/10"
                            }`}
                          >
                            <RectangleVertical className="w-3.5 h-3.5 text-white" />
                            <span
                              className={`text-[9px] uppercase tracking-tight ${isRightHighlighted ? "text-white font-black" : "text-white/80 group-hover:text-white font-black"}`}
                            >
                              {language === "cy" ? "Golwg Dde" : "Right View"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="text-[9px] font-bold uppercase tracking-widest bg-slate-900 border-none text-white px-2 py-1"
                          >
                            {language === "cy" ? "Dde" : "Right"}
                          </TooltipContent>
                        </Tooltip>
                      </>
                    );
                  })()}

                  {activeTab !== "model" && (
                    <>
                      <div className="h-[1px] bg-white/10 my-1 mx-1" />

                      {/* Visibility Toggles */}
                      {(() => {
                        const isGridHighlighted =
                          showGrid ||
                          highlightedSection === "subsec_3d_grid_hover" ||
                          highlightedSection === "subsec-3d-grid";
                        const isBasePlateHighlighted =
                          showBasePlate ||
                          highlightedSection ===
                            "subsec_3d_printer_base_hover" ||
                          highlightedSection === "subsec-3d-printer-base";
                        const isAxisHighlighted =
                          showCoordinateSystem ||
                          highlightedSection ===
                            "subsec_3d_coordinate_system_hover" ||
                          highlightedSection === "subsec-3d-coordinate-system";
                        const isBuildVolumeHighlighted =
                          showBuildVolume ||
                          highlightedSection ===
                            "subsec_3d_build_volume_hover" ||
                          highlightedSection === "subsec-3d-build-volume";

                        return (
                          <>
                            <button
                              id="subsec-view-item-baseplate"
                              onClick={() => setShowBasePlate(!showBasePlate)}
                              className={`p-2 transition-all flex items-center gap-2.5 w-full group rounded-lg text-left ${isBasePlateHighlighted ? "bg-white/20 text-white border border-white/30 font-bold" : "text-white/80 hover:bg-white/10"}`}
                            >
                              <Square className="w-3.5 h-3.5 text-white" />
                              <span className="text-[9px] font-black uppercase tracking-tight">
                                {language === "cy"
                                  ? "Plât Sylfaen"
                                  : "Base Plate"}
                                :{" "}
                                {showBasePlate
                                  ? language === "cy"
                                    ? "Ymlaen"
                                    : "On"
                                  : language === "cy"
                                    ? "I ffwrdd"
                                    : "Off"}
                              </span>
                            </button>

                            <button
                              id="subsec-view-item-grid"
                              onClick={() => setShowGrid(!showGrid)}
                              className={`p-2 transition-all flex items-center gap-2.5 w-full group rounded-lg text-left ${isGridHighlighted ? "bg-white/20 text-white border border-white/30 font-bold" : "text-white/80 hover:bg-white/10"}`}
                            >
                              <Grid3X3 className="w-3.5 h-3.5 text-white" />
                              <span className="text-[9px] font-black uppercase tracking-tight">
                                {language === "cy" ? "Grid" : "Grid"}:{" "}
                                {showGrid
                                  ? language === "cy"
                                    ? "Ymlaen"
                                    : "On"
                                  : language === "cy"
                                    ? "I ffwrdd"
                                    : "Off"}
                              </span>
                            </button>

                            <button
                              id="subsec-view-item-axis"
                              onClick={() =>
                                setShowCoordinateSystem(!showCoordinateSystem)
                              }
                              className={`p-2 transition-all flex items-center gap-2.5 w-full group rounded-lg text-left ${isAxisHighlighted ? "bg-white/20 text-white border border-white/30 font-bold" : "text-white/80 hover:bg-white/10"}`}
                            >
                              <Compass className="w-3.5 h-3.5 text-white" />
                              <span className="text-[9px] font-black uppercase tracking-tight">
                                {language === "cy" ? "Echel" : "Axis"}:{" "}
                                {showCoordinateSystem
                                  ? language === "cy"
                                    ? "Ymlaen"
                                    : "On"
                                  : language === "cy"
                                    ? "I ffwrdd"
                                    : "Off"}
                              </span>
                            </button>

                            <button
                              id="subsec-view-item-buildvolume"
                              onClick={() =>
                                setShowBuildVolume(!showBuildVolume)
                              }
                              className={`p-2 transition-all flex items-center gap-2.5 w-full group rounded-lg text-left ${isBuildVolumeHighlighted ? "bg-white/20 text-white border border-white/30 font-bold" : "text-white/80 hover:bg-white/10"}`}
                            >
                              <Maximize className="w-3.5 h-3.5 text-white" />
                              <span className="text-[9px] font-black uppercase tracking-tight">
                                {language === "cy"
                                  ? "Cyfaint Adeiladu"
                                  : "Build Volume"}
                                :{" "}
                                {showBuildVolume
                                  ? language === "cy"
                                    ? "Ymlaen"
                                    : "On"
                                  : language === "cy"
                                    ? "I ffwrdd"
                                    : "Off"}
                              </span>
                            </button>
                          </>
                        );
                      })()}
                    </>
                  )}
                </TooltipProvider>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="w-44 h-11 relative">
          {/* Status UI removed - moved to top bar */}
        </div>
      </div>

      {/* Title Bar (Only when showA4Sheet is true) */}
      {showA4Sheet && (
        <div className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 shadow-md">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full animate-pulse ${isTechDrawingActive ? 'bg-blue-500' : 'bg-purple-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
              {isTechDrawingActive 
                ? (language === "cy" ? "Rhagolwg Wyneb Dyluniad" : "Technical Drawing Real-time Preview")
                : (language === "cy" ? "Rhagolwg Llun y Model" : "Model Picture Real-time Preview")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {isTechDrawingActive ? "ISO A4 • Landscape" : "ISO A4 • Landscape • Blank Page"}
            </span>
            <button
              onClick={() => {
                if (isTechDrawingActive) {
                  window.dispatchEvent(new CustomEvent("close-tech-drawing-preview"));
                } else {
                  window.dispatchEvent(new CustomEvent("close-model-picture-preview"));
                }
              }}
              className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer pointer-events-auto"
            >
              {language === "cy" ? "Dychwelyd i 3D" : "Back to 3D"}
            </button>
          </div>
        </div>
      )}

      {/* Main View Area Container */}
      <div 
        className={
          showA4Sheet 
            ? "flex-1 w-full flex items-center justify-center overflow-hidden relative my-3 select-none"
            : "flex-1 min-h-0 relative"
        }
      >
        <div 
          className={
            showA4Sheet 
              ? "relative border-4 border-[#334155] rounded-xl shadow-2xl bg-white overflow-hidden flex items-center justify-center font-sans"
              : "w-full h-full relative"
          }
          style={
            showA4Sheet 
              ? { 
                  aspectRatio: "297 / 210", 
                  width: "100%", 
                  maxWidth: "min(85vw, calc(70vh * 1.4142))", 
                  maxHeight: "min(70vh, calc(85vw / 1.4142))" 
                } 
              : undefined
          }
        >
          {isTechDrawingActive && techDrawingPreviewUrl && (
            <img 
              src={techDrawingPreviewUrl} 
              alt="Technical Drawing Background" 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
              style={{ contentVisibility: 'auto' }}
            />
          )}

          <div
            style={
              isTechDrawingActive 
                ? {
                    position: "absolute",
                    left: `${isometricBox.left}%`,
                    top: `${isometricBox.top}%`,
                    width: `${isometricBox.width}%`,
                    height: `${isometricBox.height}%`,
                    zIndex: 10,
                  }
                : {
                    width: "100%",
                    height: "100%",
                    position: "relative",
                  }
            }
          >
            <Canvas
              key={isTechDrawingActive ? "ortho-canvas" : "persp-canvas"}
              shadows
              dpr={[1, 2]}
              camera={
                isTechDrawingActive
                  ? {
                      left: -(Math.max(dimensions.x, dimensions.y, dimensions.z) * 1.35 + 12) / 2,
                      right: (Math.max(dimensions.x, dimensions.y, dimensions.z) * 1.35 + 12) / 2,
                      top: (Math.max(dimensions.x, dimensions.y, dimensions.z) * 1.35 + 12) / 2,
                      bottom: -(Math.max(dimensions.x, dimensions.y, dimensions.z) * 1.35 + 12) / 2,
                      near: 0.1,
                      far: 5000,
                      position: [300, -300, params.height / 2 + 240],
                      up: [0, 0, 1]
                    }
                  : { position: [110, -110, 110], up: [0, 0, 1] }
              }
              orthographic={isTechDrawingActive}
              gl={{ preserveDrawingBuffer: true, alpha: true }}
            >
              <ScreenshotExporter 
                params={params} 
                volume={volume} 
                dimensions={dimensions} 
                language={language} 
              />
              <SmileyRaycaster activeTab={activeTab} />
              <OrbitControls
                ref={controlsRef}
                makeDefault
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2}
                target={[0, 0, params.height / 2]}
                enablePan={false}
                enableZoom={!isTechDrawingActive}
                onStart={() => setCurrentView(null)}
              />

          <ambientLight intensity={0.8} />
          <directionalLight
            position={[100, 100, 200]}
            intensity={0.7}
            castShadow
          />
          <pointLight position={[-100, -100, 200]} intensity={0.3} />
          <Environment preset="studio" />
          <SyncMiniCamera
            miniCameraRef={miniCameraRef}
            targetZ={params.height / 2}
            params={params}
          />

          <group>
            <PrinterVolume
              params={params}
              volume={volume}
              showGrid={activeTab === "model" ? false : showGrid}
              showBasePlate={activeTab === "model" ? false : showBasePlate}
              showDimensions={showDimensions}
              showVolume={showVolume}
              showBuildVolume={activeTab === "model" ? false : showBuildVolume}
              mode={mode}
              highlightedSection={highlightedSection}
            />

            {/* Disable 3D paper plane to keep A4 sheet perfectly flat/stationary in 2D HTML parent overlay */}
            {false && showA4Sheet && (
              <group position={[0, 0, -5.5]} rotation={[0, 0, 0]}>
                {/* Visual A4 Sheet (ratio is sqrt(2) ~ 1.414) */}
                <mesh receiveShadow>
                  <planeGeometry args={[420, 297]} />
                  <meshBasicMaterial color="#FAFAFA" side={THREE.DoubleSide} />
                </mesh>
                {/* A4 border outlines */}
                <lineSegments position={[0, 0, 0.01]}>
                  <edgesGeometry args={[new THREE.PlaneGeometry(390, 275)]} />
                  <lineBasicMaterial color="#334155" linewidth={2} />
                </lineSegments>
                {/* A4 title blocks box border */}
                <lineSegments position={[0, 0, 0.01]}>
                  <edgesGeometry args={[new THREE.PlaneGeometry(384, 269)]} />
                  <lineBasicMaterial color="#94A3B8" linewidth={1} />
                </lineSegments>
              </group>
            )}

            {importedGeometry && (
              <mesh geometry={importedGeometry}>
                <meshStandardMaterial
                  color="#94A3B8"
                  roughness={0.5}
                  transparent={mode === "gcode"}
                  opacity={
                    mode === "gcode"
                      ? viewMode === "material"
                        ? 0.05
                        : 0.2
                      : 0.8
                  }
                />
              </mesh>
            )}

            <group
              scale={
                highlightedSection === "subsec_3d_model_hover" ||
                highlightedSection === "subsec-3d-model"
                  ? [1.03, 1.03, 1.03]
                  : [1, 1, 1]
              }
            >
              <ExtrudedModel
                params={params}
                settings={settings}
                transparent={mode === "gcode" || !!importedGeometry}
                wireframe={
                  highlightedSection === "subsec_3d_model_hover" ||
                  highlightedSection === "subsec-3d-model"
                }
              />

              {isStlPreviewOn && stlGeometry && (
                <mesh geometry={stlGeometry}>
                  <meshBasicMaterial
                    color="#10B981"
                    wireframe={true}
                    transparent={true}
                    opacity={0.8}
                    depthWrite={true}
                    depthTest={true}
                    side={THREE.DoubleSide}
                    polygonOffset={true}
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                  />
                </mesh>
              )}

              {is3mfPreviewOn && stlGeometry && (
                <mesh geometry={stlGeometry}>
                  <meshBasicMaterial
                    color="#06B6D4"
                    wireframe={true}
                    transparent={true}
                    opacity={0.8}
                    depthWrite={true}
                    depthTest={true}
                    side={THREE.DoubleSide}
                    polygonOffset={true}
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                  />
                </mesh>
              )}
            </group>

            {mode === "gcode" && (
              <PathRenderer
                key={`path-renderer-${points.length}-${points[0]?.x ?? 0}-${points[points.length - 1]?.x ?? 0}`}
                points={points}
                progress={playhead}
                totalDistance={totalDistance}
                cumulativeDistances={cumulativeDistances}
                viewMode={viewMode}
                color={
                  highlightedSection === "subsec_3d_path_hover" ||
                  highlightedSection === "subsec-3d-path"
                    ? "#F43F5E"
                    : viewMode === "path"
                      ? "#64748B"
                      : params.color
                }
                layerHeight={settings.layerHeight}
                nozzleSize={settings.depositionWidth ?? settings.extrusionWidth ?? settings.nozzleDiameter ?? 4.0}
                extrudingSegments={extrudingSegments}
                highlightedSection={highlightedSection}
              />
            )}

            {(mode === "gcode" || activeTab === "save") && (
              <Grid
                name="printer-grid"
                visible={showGrid}
                args={[240, 240]}
                cellSize={10}
                cellThickness={0.7}
                cellColor="#22C55E"
                sectionSize={50}
                sectionThickness={1.4}
                sectionColor="#15803D"
                fadeDistance={1200}
                infiniteGrid={false}
                rotation={[Math.PI / 2, 0, 0]}
                position={[0, 0, 0.05]}
              />
            )}

            {(mode === "gcode" || activeTab === "save") && (
              <group
                name="printer-axis"
                visible={showCoordinateSystem}
                position={[0, 0, -0.2]}
                scale={
                  highlightedSection ===
                    "subsec_3d_coordinate_system_hover" ||
                  highlightedSection === "subsec-3d-coordinate-system"
                    ? [1.08, 1.08, 1.08]
                    : [1, 1, 1]
                }
              >
                  <group>
                    <mesh
                      position={[0, 0, 0.2]}
                      rotation={[0, 0, -Math.PI / 2]}
                    >
                      <cylinderGeometry args={[0.4, 0.4, 250]} />
                      <meshBasicMaterial color="#EF4444" />
                    </mesh>
                    <Text
                      position={[135, 0, 2]}
                      fontSize={10}
                      color="#EF4444"
                      fontWeight="black"
                      rotation={[Math.PI / 2, 0, 0]}
                    >
                      X
                    </Text>
                    {majorTickMarks.map((val) => (
                      <group key={`x-major-${val}`} position={[val, 0, 0.2]}>
                        <mesh position={[0, -3, 0]}>
                          <boxGeometry args={[0.8, 6, 0.5]} />
                          <meshBasicMaterial color="#EF4444" />
                        </mesh>
                        <Text
                          position={[0, -10, 2]}
                          fontSize={7}
                          color="#64748B"
                          fontWeight="black"
                          rotation={[Math.PI / 2, 0, 0]}
                        >
                          {val}
                        </Text>
                      </group>
                    ))}
                    {minorTickMarks.map((val) => (
                      <group key={`x-minor-${val}`} position={[val, 0, 0.2]}>
                        <mesh position={[0, -2, 0]}>
                          <boxGeometry args={[0.4, 4, 0.3]} />
                          <meshBasicMaterial
                            color="#EF4444"
                            opacity={0.6}
                            transparent
                          />
                        </mesh>
                      </group>
                    ))}
                  </group>

                  <group>
                    <mesh position={[0, 0, 0.2]}>
                      <cylinderGeometry args={[0.4, 0.4, 250]} />
                      <meshBasicMaterial color="#22C55E" />
                    </mesh>
                    <Text
                      position={[0, 135, 2]}
                      fontSize={10}
                      color="#22C55E"
                      fontWeight="black"
                      rotation={[Math.PI / 2, 0, 0]}
                    >
                      Y
                    </Text>
                    {majorTickMarks.map((val) => (
                      <group key={`y-major-${val}`} position={[0, val, 0.2]}>
                        <mesh position={[-3, 0, 0]}>
                          <boxGeometry args={[6, 0.8, 0.5]} />
                          <meshBasicMaterial color="#22C55E" />
                        </mesh>
                        <Text
                          position={[-12, 0, 2]}
                          fontSize={7}
                          color="#64748B"
                          fontWeight="black"
                          rotation={[Math.PI / 2, 0, 0]}
                        >
                          {val}
                        </Text>
                      </group>
                    ))}
                    {minorTickMarks.map((val) => (
                      <group key={`y-minor-${val}`} position={[0, val, 0.2]}>
                        <mesh position={[-2, 0, 0]}>
                          <boxGeometry args={[4, 0.4, 0.3]} />
                          <meshBasicMaterial
                            color="#22C55E"
                            opacity={0.6}
                            transparent
                          />
                        </mesh>
                      </group>
                    ))}
                  </group>

                  <group>
                    <mesh position={[0, 0, 125]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.4, 0.4, 250]} />
                      <meshBasicMaterial color="#3B82F6" />
                    </mesh>
                    <Text
                      position={[0, 10, 260]}
                      fontSize={12}
                      color="#3B82F6"
                      fontWeight="black"
                      rotation={[Math.PI / 2, 0, 0]}
                    >
                      Z
                    </Text>
                    {majorZTickMarks.map((val) => (
                      <group key={`z-major-${val}`} position={[0, 0, val]}>
                        <mesh position={[-3, 0, 0]}>
                          <boxGeometry args={[6, 0.8, 0.5]} />
                          <meshBasicMaterial color="#3B82F6" />
                        </mesh>
                        <Text
                          position={[-12, 0, 2]}
                          fontSize={7}
                          color="#64748B"
                          fontWeight="black"
                          rotation={[Math.PI / 2, 0, 0]}
                        >
                          {val}
                        </Text>
                      </group>
                    ))}
                    {minorZTickMarks.map((val) => (
                      <group key={`z-minor-${val}`} position={[0, 0, val]}>
                        <mesh position={[-2, 0, 0]}>
                          <boxGeometry args={[4, 0.4, 0.3]} />
                          <meshBasicMaterial
                            color="#3B82F6"
                            opacity={0.6}
                            transparent
                          />
                        </mesh>
                      </group>
                    ))}
                  </group>
                </group>
              )}
          </group>
        </Canvas>
          </div>
      </div>
    </div>

    {/* Footer (Only when showA4Sheet is true) */}
    {showA4Sheet && (
      <div className="w-full flex justify-between text-[9px] font-semibold text-slate-500 uppercase tracking-widest border-t border-slate-900/50 pt-3">
        <span>
          {isTechDrawingActive 
            ? (language === "cy" ? "Arddull: Dyluniad Technegol" : "STYLE: TECHNICAL DRAWING")
            : (language === "cy" ? "Arddull: Llun Model" : "STYLE: MODEL PICTURE")}
        </span>
        <span>
          {isTechDrawingActive
            ? (language === "cy" 
                ? "Rheolyddion: Rhyngweithiol (Llusgwch i droi, Dim Chwyddo)" 
                : "CONTROLS: INTERACTIVE (DRAG TO ROTATE, NO ZOOM)")
            : (language === "cy"
                ? "Rheolyddion: Rhyngweithiol (Llusgwch i droi)"
                : "CONTROLS: INTERACTIVE (DRAG TO ROTATE/ZOOM)")}
        </span>
      </div>
    )}

    {/* HUD Sizes & Volume Text Overlays (Mimicking the expandable View controls) */}
    {!showA4Sheet && (
      <div
        id="subsec-model-info-container"
        className="absolute bottom-3 right-3 z-30 flex flex-col items-end pointer-events-none"
      >
        <div
          className={`bg-[#7F7F7F] p-1.5 rounded-xl border flex flex-col gap-0.5 pointer-events-auto transition-all duration-300 ${isModelExpanded ? "w-44" : "w-[85px]"} ${
            highlightedSection === "subsec_3d_model_info_hover" ||
            highlightedSection === "subsec-3d-model-info" ||
            highlightedSection === "subsec-model-info"
              ? "border-[#404040] bg-[#7F7F7F] ring-4 ring-white/40 scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.25)] z-50"
              : "border-[#404040] shadow-[0_0_12px_rgba(0,0,0,0.15)]"
          }`}
        >
          <button
            onClick={() => setIsModelExpanded(!isModelExpanded)}
            className="p-1.5 text-white hover:bg-[#7F7F7F]/90 rounded-lg transition-all flex items-center gap-2 w-full group overflow-hidden text-left"
          >
            <Info className="w-3.5 h-3.5 shrink-0 text-white" />
            <span className="text-[9px] font-black uppercase tracking-tight text-white whitespace-nowrap">
              {language === "cy" ? "Model" : "Model"}
            </span>
            <AnimatePresence>
              {isModelExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-[9px] font-black uppercase tracking-tight text-white whitespace-nowrap"
                >
                  {language === "cy" ? "Gwybodaeth" : "Info"}
                </motion.span>
              )}
            </AnimatePresence>
            {isModelExpanded && (
              <ChevronRight className="w-3 h-3 ml-auto shrink-0 text-white" />
            )}
          </button>

          <AnimatePresence>
            {isModelExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col px-1 pb-1 mt-1 border-t border-white/10 pt-1.5"
              >
                <div className="bg-white rounded-lg p-2 flex flex-col gap-1.5 border border-[#404040]/10 shadow-sm font-mono text-[10px] font-bold">
                  <div className="text-black leading-normal">
                    {language === "cy" ? "Meintiau'r model" : "Model sizes"}: X
                    = {dimensions.x} mm, Y = {dimensions.y} mm, Z ={" "}
                    {dimensions.z} mm
                  </div>
                  <div className="text-black leading-normal pt-1.5 border-t border-stone-100">
                    {language === "cy" ? "Cyfaint model" : "Model volume"}:{" "}
                    {(volume / 1000).toFixed(2)} cm³
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}
    </div>
  );
});
