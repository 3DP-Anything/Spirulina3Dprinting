import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UKFlagSVG, WelshFlagSVG } from '../lib/i18n';
import { ModelParams, ShapeType, TextureType, DEFAULT_MODEL_PARAMS } from '../lib/types';
import { getRoundedPolygonPoints } from '../lib/geometry';

interface SmileyMessage {
  text: string;
  textCy?: string;
  arrowNeeded: boolean;
  arrowDirection?: string;
  arrowLocation?: string;
  left?: string;
  top?: string;
}

const DEFAULT_MESSAGES_MAP: Record<string, SmileyMessage[]> = {
  starting: [
    { 
      text: "Croeso, rwy'n gynorthwyydd argraffu 3D i chi, dewiswch eich iaith\n\nWelcome, I'm your 3D printing assistant, select your language", 
      arrowNeeded: false, 
      left: "calc(50vw - 220px)", 
      top: "middle" 
    },
    { 
      text: "Using this app, you can:\n1. Customise your own 3D model\n2. Prepare and visualise instructions for your 3D Printer (G-Code file)\n3. Export the G-Code file and 3D model for 3D Printing.",
      textCy: "Trwy ddefnyddio'r ap hwn, gallwch:\n1. Addasu eich model 3D eich hun\n2. Paratoi a delweddu cyfarwyddiadau ar gyfer eich Argraffydd 3D (ffeil G-god)\n3. Allforio'r ffeil G-god a'r model 3D ar gyfer Argraffu 3D.", 
      arrowNeeded: false, 
      left: "calc(50vw - 220px)", 
      top: "middle" 
    },
    { 
      text: "First, click the (1) DESIGN button in the top bar and adjust parameters in the \"Shape\", \"Texture\", and \"Deformations\" boxes.", 
      textCy: "Yn gyntaf, cliciwch ar y botwm (1) DYLUNIO yn y bar uchaf ac addaswch y paramedrau yn y blychau \"Siâp\", \"Gwead\", ac \"Anffurfiadau\".", 
      arrowNeeded: false, 
      left: "calc(50vw - 220px)", 
      top: "middle" 
    },
    { 
      text: "Next, once satisfied with your design, click (2) CALCULATE to generate G-Code file.", 
      textCy: "Nesaf, unwaith y byddwch yn fodlon â'ch dyluniad, cliciwch (2) CYFRIFO i gynhyrchu ffeil G-god.", 
      arrowNeeded: false, 
      left: "calc(50vw - 220px)", 
      top: "middle" 
    },
    { 
      text: "The G-CODE file contains all the instructions the 3D printer needs to follow to print your model.", 
      textCy: "Mae'r ffeil G-god yn cynnwys yr holl gyfarwyddiadau y mae angen i'r argraffydd 3D eu dilyn i argraffu eich model.", 
      arrowNeeded: false, 
      left: "calc(50vw - 220px)", 
      top: "middle" 
    },
    { 
      text: "You can visualise these instructions as an animation by pressing the Play button of the G-Code player.", 
      textCy: "Gallwch ddelweddu'r cyfarwyddiadau hyn fel animeiddiad trwy bwyso botwm Chwarae'r chwaraewr G-god.", 
      arrowNeeded: false, 
      left: "calc(50vw - 220px)", 
      top: "middle" 
    },
    { 
      text: "Finally, Click (3) SAVE in the top bar, and select \"SAVE G-CODE\" to export your file.", 
      textCy: "Yn olaf, Cliciwch (3) CADW yn y bar uchaf, a dewiswch \"CADW G-GOD\" i allforio eich ffeil.", 
      arrowNeeded: false, 
      left: "calc(50vw - 220px)", 
      top: "middle" 
    },
    { 
      text: "Navigation: You can zoom, and rotate the 3D model using your fingers [PINCH_ICON] (touchscreen) or mouse [MOUSE_ICON] (Left and Middle buttons).", 
      textCy: "Llywiant: Gallwch chwyddo a chylchdroi'r model 3D gan ddefnyddio eich bysedd [PINCH_ICON] (sgrîn gyffwrdd) neu llygoden [MOUSE_ICON] (botymau Chwith a Chanol).", 
      arrowNeeded: false, 
      left: "calc(50vw - 220px)", 
      top: "middle" 
    },
    { 
      text: "Need more help? Drag and drop me onto any area of the screen, and I will provide information about the selected section.", 
      textCy: "Angen mwy o help? Llusgwch a gollwng fi ar unrhyw ardal o'r sgrîn, a byddaf yn darparu gwybodaeth am yr adran ddewisedig.", 
      arrowNeeded: false, 
      left: "calc(50vw - 220px)", 
      top: "middle" 
    }
  ],
  design_hover: [
    { 
      text: "You can customise the 3D model by changing the parameters in the Shape, Texture, and Deformations boxes below.", 
      textCy: "Gallwch addasu y model 3D trwy newid y paramedrau yn y blychau Siâp, Gwead, ac Anffurfiadau isod.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "middle" 
    },
    { 
      text: "Drop me onto the boxes below for more information.", 
      textCy: "Gollyngwch fi ar y blychau isod am fwy o wybodaeth.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "middle" 
    }
  ],
  gcode_hover: [
    { 
      text: "To 3D print your model, the printer needs instructions specifying where to deposit material, at what speed, and in what quantity.", 
      textCy: "I argraffu eich model 3D, mae angen cyfarwyddiadau ar yr argraffydd sy'n nodi ble i osod deunydd, ar ba gyflymder, ac ym mha faint.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "top" 
    },
    { 
      text: "These instructions are stored in a G-Code file, where each line contains a separate command for the printer.", 
      textCy: "Mae'r cyfarwyddiadau hyn yn cael eu storio mewn ffeil G-god, lle mae pob llinell yn cynnwys gorchymyn ar wahân i'r argraffydd.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "middle" 
    },
    { 
      text: "You can use the interface below to visualise the G-Code instructions.", 
      textCy: "Gallwch ddefnyddio'r rhyngwyneb isod i ddelweddu'r cyfarwyddiadau G-god.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "middle" 
    },
    { 
      text: "Drag and drop me onto the boxes below for more information.", 
      textCy: "Llusgwch a gollwng fi ar y blychau isod am fwy o wybodaeth.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "bottom" 
    }
  ],
  settings_hover: [
    { 
      text: "You can change the 3D Printer and Model Default settings in this menu.", 
      textCy: "Gallwch newid gosodiadau Argraffydd 3D a Diofyn y Model yn y ddewislen hon.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "top" 
    },
    { 
      text: "Make sure to click the 'Apply Settings' button to apply and activate your changes.", 
      textCy: "Gwnewch yn siŵr eich bod yn clicio ar y botwm 'Gweithredu Gosodiadau' i gymhwyso a gweithredu eich newidiadau.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "middle" 
    },
    { 
      text: "Note: All setting changes are temporary and will reset to the default settings when the app restarts.", 
      textCy: "Nodyn: Mae pob newid gosodiad yn dros dro a bydd yn ailosod i'r gosodiadau diofyn pan fydd yr ap yn ailgychwyn.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "middle" 
    },
    { 
      text: "To keep your custom settings, you can export them and re-import them in your next session.", 
      textCy: "I gadw eich gosodiadau dylunio, gallwch eu hallforio a'u hailmewnforio yn eich sesiwn nesaf.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "bottom" 
    },
    { 
      text: "Drop me onto the boxes below for more information.", 
      textCy: "Gollyngwch fi ar y blychau isod am fwy o wybodaeth.", 
      arrowNeeded: false, 
      left: "356px", 
      top: "bottom" 
    }
  ],
  save_hover: [
    {
      text: "In the boxes below you can name your file and export it in various formats.",
      textCy: "Yn y blychau isod gallwch enwi eich ffeil a'i hallforio mewn amrywiol fformatau.",
      arrowNeeded: false,
      left: "356px",
      top: "top"
    },
    {
      text: "Drop me onto the boxes below for more information.",
      textCy: "Gollyngwch fi ar y blychau isod am fwy o wybodaeth.",
      arrowNeeded: false,
      left: "356px",
      top: "top"
    }
  ],
  subsec_save_name_hover: [
    {
      text: "Give a name to your model here.",
      textCy: "Rhowch enw i'ch model yma.",
      arrowNeeded: false,
      left: "356px",
      top: "top"
    }
  ],
  subsec_save_guide_hover: [
    {
      text: "Save the G-Code instructions for 3D printing your model by clicking \"SAVE G-CODE\"",
      textCy: "Arbedwch y cyfarwyddiadau G-god ar gyfer argraffu 3D o'ch model trwy glicio \"CADW G-GOD\".",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    }
  ],
  subsec_save_model_cup_hover: [
    {
      text: "You can save your model to retrieve later into this App by clicking \"SAVE AS .CUP FILE\"",
      textCy: "Gallwch arbed eich model i'w adfer yn ddiweddarach i'r Ap hwn trwy glicio \"CADW FEL FFEIL .CUP\".",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    }
  ],
  subsec_save_model_stl_hover: [
    {
      text: "You can save your model as a 3D shape in high-performance 3MF (or standard STL) format.",
      textCy: "Gallwch gadw eich model fel siâp 3D ar fformat 3MF perfformiad uchel (neu fformat STL safonol).",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "3MF is a modern, high-quality 3D printing format that yields smaller file sizes than traditional STL.",
      textCy: "Mae 3MF yn fformat argraffu 3D modern, o ansawdd uchel sy'n cynhyrchu meintiau ffeiliau llai na STL traddodiadol.",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "Before saving your model as a 3MF or STL file you must: ",
      textCy: "Cyn cadw eich model fel ffeil 3MF neu STL mae'n rhaid i chi: ",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "1- Specify/adjust the wall thickness for your model",
      textCy: "1- Nodi/addasu trwch y wal ar gyfer eich model",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "2- Click the \"3MF PREVIEW\" or \"STL PREVIEW\" button to visualise the file (Optional).",
      textCy: "2- Clicio'r botwm \"RHAGOLWG 3MF\" neu \"RHAGOLWG STL\" i ddelweddu'r ffeil (Dewisol).",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "The resolution of the 3D model can be changed using the \"STL QUALITY\" slider.",
      textCy: "Gellir newid cydraniad y model 3D trwy ddefnyddio'r llithrydd \"ANSAWDD STL\".",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "Higher resolution files will produce smoother surfaces but result in larger STL files (more memory usage)",
      textCy: "Bydd ffeiliau cydraniad uwch yn cynhyrchu arwynebau llyfnach ond yn arwain at ffeiliau STL mwy (mwy o ddefnydd o gof)",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "3- Click the \"3MF\" or \"STL\" button.",
      textCy: "3- Clicio'r botwm \"3MF\" neu \"STL\".",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "Note: Saving your model as a surface models will result in a model with no thickness that cannot be 3D printed.",
      textCy: "Nodyn: Bydd arbed eich model fel model arwynebau yn arwain at fodel heb drwch na ellir ei argraffu 3D.",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    }
  ],
  subsec_save_picture_hover: [
    {
      text: "You can take a picture of your 3D model to share with your friends or print on paper by clicking \"SAVE PICTURE\"",
      textCy: "Gallwch dynnu llun o'ch model 3D i'w rannwodd gyda'ch ffrindiau neu ei argraffu ar bapur trwy glicio \"CADW LLUN\".",
      arrowNeeded: false,
      left: "356px",
      top: "bottom"
    }
  ],
  subsec_size_hover: [
    {
      text: "The base diametre and height of your model can be adjusted here.",
      textCy: "Gellir addasu diamedr sylfaen ac uchder eich model yma.",
      arrowNeeded: false,
      left: "356px",
      top: "top"
    }
  ],
  subsec_shape_hover: [
    {
      text: "By modifying the \"SHAPE\" parameters, you can change the 3D model shape and adjust the number of sides.",
      textCy: "Trwy fodyfeiddio'r paramedrau \"SIÂP\", gan gynnwys radiws corneli ac ochrau, gallwch drawsnewid ffurf y model yn llwyr.",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    }
  ],
  subsec_texture_hover: [
    {
      text: "By modifying the \"TEXTURE\" parameters, you can add different textures to the 3D model.",
      textCy: "Trwy fodyfeiddio'r paramedrau \"GWEAD\", gallwch ychwanegu gwahanol weadau i'r model 3D.",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    }
  ],
  subsec_ribs_hover: [
    {
      text: "The \"RIBS\" tool adds evenly spaced vertical ribs directly to the surface of your 3D model.",
      textCy: "Mae'r offeryn \"ASENNAU\" yn ychwanegu asennau gofodol unffurf yn uniongyrchol i arwyneb eich model 3D.",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "How to use Ribs:\n• Set the number of ribs between 4 and 12.\n• Set rib depth (default 2 mm), starting at 0 mm at base and reaching full depth at half height.\n• Set rib width (default 5 mm).\n• Choose a rib profile (Triangular, Rectangular, or Semicircular).\n• Optionally invert rib direction to create recessed grooves instead of protruding ridges.",
      textCy: "Sut i ddefnyddio Asennau:\n• Gosodwch nifer yr asennau rhwng 4 a 12.\n• Gosodwch ddyfnder yr asen (rhagosodiad 2 mm), gan ddechrau ar 0 mm ar y gwaelod a chyrraedd dyfnder llawn ar hanner uchder.\n• Gosodwch led yr asen (rhagosodiad 5 mm).\n• Dewiswch broffil asennau (Trionglog, Hirsgwar, neu Hanner Cylch).\n• Gallwch hefyd wrthdroi cyfeiriad yr asennau i greu rhigolau mewnol yn lle cribau allanol.",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    }
  ],
  subsec_deformations_hover: [
    {
      text: "By modifying the \"DEFORMATIONS\" parameters, you can apply different deformations to the 3D model.",
      textCy: "Trwy fodyfeiddio'r paramedrau \"ANFFURIADAU\", gallwch gymhwyso gwahanol anffurfiadau i'r model 3D.",
      arrowNeeded: false,
      left: "356px",
      top: "bottom"
    }
  ],
  subsec_appearance_hover: [
    {
      text: "\"APPEARANCES\" allows you to change the colour of the 3D model on the screen.",
      textCy: "Mae \"YMDDANGOSIADAU\" yn caniatáu i chi newid lliw'r model 3D ar y sgrîn.",
      arrowNeeded: false,
      left: "356px",
      top: "bottom"
    },
    {
      text: "The colour on the screen will not be the colour of your 3D printed model.",
      textCy: "Ni fydd y lliw ar y sgrîn yn lliw eich model wedi'i argraffu 3D.",
      arrowNeeded: false,
      left: "356px",
      top: "bottom"
    },
    {
      text: "The colour of your 3D printed model will be the same as the colour of the paste used for printing it.",
      textCy: "Bydd lliw eich model wedi'i argraffu 3D yr un fath â lliw y past a ddefnyddir ar gyfer ei argraffu.",
      arrowNeeded: false,
      left: "356px",
      top: "bottom"
    }
  ],
  subsec_settings_printer_hover: [
    {
      text: "Under 3D Printer Settings, configure Speed, Layer height, Deposition width, and Flow.",
      textCy: "O dan Gosodiadau Argraffydd 3D, ffurfweddwch Gyflymder, Uchder haen, Lled dyddodi, a Llif.",
      arrowNeeded: false,
      left: "356px",
      top: "top"
    }
  ],
  subsec_settings_sizes_hover: [
    {
      text: "In the Model Default Sizes settings, establish starting sizes and enable sizing limits.",
      textCy: "Yn adran Meintiau Diofyn y Model, sefydlwch feintiau cychwynnol a galluogi terfynau maint.",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    }
  ],
  subsec_gcode_playback_hover: [
    {
      text: "Use the \"G-CODE PLAYER\" buttons to play the G-Code instructions, either one by one or layer by layer.",
      textCy: "Defnyddiwch fotymau \"CHWARAEWR G-GOD\" i chwarae'r cyfarwyddiadau G-god, naill ai fesul un neu fesul haen.",
      arrowNeeded: false,
      left: "356px",
      top: "top"
    },
    {
      text: "You can adjust the animation speed, or change the display from 2D (PATH) to 3D (3D MODEL).",
      textCy: "Gallwch addasu cyflymder yr animeiddiad, neu newid yr arddangosiad o 2D (LLWYBR) i 3D (MODEL 3D).",
      arrowNeeded: false,
      left: "356px",
      top: "top"
    }
  ],
  subsec_gcode_texture_hover: [
    {
      text: "The \"G-CODE TEXTURE\" tool applies decorative surface patterns and ribbed textures directly to the 3D printer's toolpath without altering your 3D CAD model.\n\nHow to use this function:\n1. Switch on \"ENABLE G-CODE TEXTURE\".\n2. Set Texture Depth (how deep the waves indent or protrude) and Frequency (number of waves around the 360° perimeter).\n3. Set Layer Interval to choose how many layers between textured bands.\n4. Click \"APPLY TEXTURE\" to recalculate and preview the textured toolpath in 3D!",
      textCy: "Mae offeryn \"GWEAD G-GOD\" yn cymhwyso patrymau arwyneb addurniadol a gweadau rhesog yn uniongyrchol i lwybr offer yr argraffydd 3D heb newid eich model CAD 3D.\n\nSut i ddefnyddio'r swyddogaeth hon:\n1. Trowch ymlaen \"GALLUOGI GWEAD G-GOD\".\n2. Gosodwch Ddyfnder y Gwead (pa mor ddwfn y mae'r tonnau'n ymwthio) ac Amlder (nifer y tonnau o amgylch 360°).\n3. Gosodwch Cyfwng Haenau i ddewis faint o haenau rhwng bandiau gweadog.\n4. Cliciwch \"CYMHWYSO GWEAD\" i ailgyfrifo a rhagweld y llwybr offer gweadog mewn 3D!",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    },
    {
      text: "Additional Controls & Tips:\n• Texture Width: Adjusts detour width along the toolpath.\n• Angle Offset: Progressively rotates the wave on each subsequent layer to create a twisted spiral.\n• Solid Base: Texture is automatically skipped on solid bottom layers for a clean, stable base.\n• Click \"RESET\" anytime to return parameters to their defaults.",
      textCy: "Rheolyddion Ychwanegol ac Awgrymiadau:\n• Lled Gwead: Addasu lled y gwyriad ar hyd y llwybr offer.\n• Ongl Ogwydd: Troelli tonnau'n gynyddol ar bob haen ddilynol i greu troell.\n• Sylfaen Solet: Hepgorir y gwead yn awtomatig ar yr haenau gwaelod ar gyfer sylfaen lân a sefydlog.\n• Cliciwch \"AILOSOD\" ar unrhyw adeg i ddychwelyd paramedrau i'w gwerthoedd diofyn.",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    }
  ],
  subsec_gcode_stats_hover: [
    {
      text: "The \"PLAYBACK PROGRESS\" bars display information such as: Which line of the G-Code file is currently being displayed, the estimated build time, and the height level of the print.",
      textCy: "Mae bariau \"PROGRESS PROGRESS\" yn dangos gwybodaeth fel: Pa linell o'r ffeil G-god sy'n cael ei harddangos ar hyn o bryd, yr amser adeiladu amcangyfrifedig, ac uchder yr argraffiad.",
      arrowNeeded: false,
      left: "356px",
      top: "middle"
    }
  ],
  subsec_gcode_command_hover: [
    {
      text: "The \"G-code Command\" shows the G-Code instruction displayed on the screen.",
      textCy: "Mae'r \"Gorchymyn G-god\" yn dangos y cyfarwyddyd G-god a arddangosir ar y sgrin.",
      arrowNeeded: false,
      left: "356px",
      top: "bottom"
    }
  ],
  subsec_gcode_description_hover: [
    {
      text: "The \"G-code Command Description\" describes in plain text form the G-Code instruction displayed on the screen.",
      textCy: "Mae \"Disgrifiad Gorchymyn G-god\" yn disgrifio ar ffurf testun plaen y cyfarwyddyd G-god a arddangosir ar y sgrin.",
      arrowNeeded: false,
      left: "356px",
      top: "bottom"
    }
  ],
  subsec_3d_build_volume_hover: [
    {
      text: "Show or hide the build volume, which represents the printer's maximum printable area.",
      textCy: "Dangos neu guddio cyfaint adeiladu'r argraffydd, sy'n cynrychioli ardal argraffu fwyaf yr argraffydd.",
      arrowNeeded: false
    }
  ],
  subsec_3d_model_hover: [
    {
      text: "To customise your 3D model, adjust the Shape, Texture, and Deformations settings in the Design Parameters Menu on the left.",
      textCy: "I addasu eich model 3D, addaswch y gosodiadau Siâp, Gwead, ac Anffurfiadau yn y Ddewislen Paramedrau Dylunio ar y chwith.",
      arrowNeeded: false
    }
  ],
  subsec_3d_path_hover: [
    {
      text: "This is the path representing the trajectory the 3D printer needs to follow to print your 3D model.",
      textCy: "Dyma'r llwybr sy'n cynrychioli llwybr y mae angen i'r argraffydd 3D ei ddilyn i argraffu eich model 3D.",
      arrowNeeded: false
    },
    {
      text: "It is made up of a succession of small straight movements. The instructions for each of these moves are stored as individual text lines within the G-code file.",
      textCy: "Mae wedi'i wneud o olyniaeth o symudiadau syth bach. Mae'r cyfarwyddiadau ar gyfer pob un o'r symudiadau hyn yn cael eu cadw fel llinellau testun unigol o fewn y ffeil G-god.",
      arrowNeeded: false
    },
    {
      text: "Each line of the G-Code file tells the printer: Where to move, how fast to go, and how much material to deposit. You can use the menu on the left to see and preview how the printer will follow these instructions.",
      textCy: "Mae pob llinell o'r ffeil G-god yn dweud wrth yr argraffydd: Ble i symud, pa mor gyflym i fynd, a faint o ddeunydd i'w osod. Gallwch gymryd y ddewislen ar y chwith i weld a rhagolwg sut y bydd yr argraffydd yn dilyn y cyfarwyddiau hyn.",
      arrowNeeded: false
    }
  ],
  subsec_3d_printer_base_hover: [
    {
      text: "Show or Hide the 3D printer baseplate.",
      textCy: "Dangos neu guddio sylfaen yr argraffydd 3D.",
      arrowNeeded: false
    }
  ],
  subsec_3d_coordinate_system_hover: [
    {
      text: "Show or hide the coordinate system used by the 3D printer to determine position in space.",
      textCy: "Dangos neu guddio'r system gyfesurynnol a ddefnyddir gan yr argraffydd 3D i bennu safle yn y gofod.",
      arrowNeeded: false
    }
  ],
  subsec_3d_grid_hover: [
    {
      text: "Show or hide a 10 mm grid on the baseplate.",
      textCy: "Dangos neu guddio grid 10 mm ar y gwaelod.",
      arrowNeeded: false
    }
  ],
  subsec_3d_view_control_hover: [
    {
      text: "Use the view presets to quickly rotate the model to standard views such as Top, Front, Side, or Default 3D.",
      textCy: "Defnyddiwch y gosodiadau golwg i gylchdroi'r model yn gyglym i olygfeydd safonol fel Top, Blaen, Ochr, neu 3D Diofyn.",
      arrowNeeded: false
    }
  ],
  subsec_3d_model_info_hover: [
    {
      text: "This window displays the dimensions (in millimeters), and volume (in cubic centimeters) of your model.",
      textCy: "Mae'r ffenestr hon yn dangos dimensiynau (mewn milimetrau), a chyfaint (mewn centimetrau ciwbig) o'ch model.",
      arrowNeeded: false
    }
  ],
  subsec_import_hover: [
    {
      text: "Use Import Model to load previously created models.",
      textCy: "Defnyddiwch Mewnforio Model i lwytho modelau a grëwyd yn flaenorol.",
      arrowNeeded: false
    }
  ],
  subsec_language_hover: [
    {
      text: "Toggle App language between Welsh and English.",
      textCy: "Toglo iaith yr Ap rhwng y Gymraeg a'r Saesneg.",
      arrowNeeded: false
    }
  ],
  subsec_smiley_hover: [
    {
      text: "Turn me ON/OFF depending on whether you want assistance.",
      textCy: "Trowch fi YMLAEN/I FFWRDD yn dibynnu a ydych chi eisiau cymorth.",
      arrowNeeded: false
    },
    {
      text: "Drag and drop me onto any area of the screen, and I will provide information about the selected section.",
      textCy: "Llusgwch a gollwng fi ar unrhyw ardal o'r sgrîn, a byddaf yn darparu gwybodaeth am yr adran ddewisedig.",
      arrowNeeded: false
    }
  ]
};

// Returns standard top coordinate mapped vertically based on prompt rules
const getVerticalPositionValue = (topStr: string | undefined): string => {
  if (!topStr) return '80px';
  const val = topStr.toLowerCase();
  
  if (val.includes('top') || val === 'resting') return '80px';
  if (val.includes('middle')) return 'calc(50vh - 48px)';
  if (val.includes('bottom')) return 'calc(100vh - 340px)';

  // Parse numeric pixels
  const num = parseInt(val, 10);
  if (!isNaN(num)) {
    if (num < 180) return '80px';
    if (num >= 180 && num < 550) return 'calc(50vh - 48px)';
    return 'calc(100vh - 340px)';
  }
  
  return 'calc(50vh - 48px)';
};

// Normalize arrow directions to strictly up, right, down, or left
const normalizeDirection = (dirStr: string | undefined): 'up' | 'right' | 'down' | 'left' => {
  if (!dirStr) return 'left';
  const d = dirStr.toLowerCase();
  if (d.includes('up') || d === 'n' || d === 'u') return 'up';
  if (d.includes('down') || d === 's' || d === 'd') return 'down';
  if (d.includes('right') || d === 'e' || d === 'r') return 'right';
  return 'left';
};

// Get precise relative styling of the arrow pointing in directions
const getArrowStyleConfig = (direction: 'up' | 'right' | 'down' | 'left') => {
  if (direction === 'up') {
    return { left: '-2px', top: '-102px', rotation: -90 };
  }
  if (direction === 'down') {
    return { left: '-2px', top: '102px', rotation: 90 };
  }
  if (direction === 'left') {
    return { left: '-102px', top: '22px', rotation: 180 };
  }
  // right
  return { left: '102px', top: '22px', rotation: 0 };
};

const ArrowSVG = ({ direction, strokeWidth }: { direction: 'up' | 'right' | 'down' | 'left'; strokeWidth: number }) => {
  const config = getArrowStyleConfig(direction);

  return (
    <div style={{ transform: `rotate(${config.rotation}deg)`, transformOrigin: 'center center' }} className="transition-transform duration-300">
      <svg viewBox="0 0 100 100" className="w-[100px] h-[100px] select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(15,23,42,0.15)] overflow-visible">
        {/* Outmost Thin Pale Grey Outline */}
        <path
          d="M 28 34 Q 28 24 38 29 L 68 45 Q 76 50 68 55 L 38 71 Q 28 76 28 66 Z"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth * 1.75}
          strokeOpacity="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner Black Outline & Yellow Fill */}
        <path
          d="M 28 34 Q 28 24 38 29 L 68 45 Q 76 50 68 55 L 38 71 Q 28 76 28 66 Z"
          fill="#FFEB3B"
          stroke="#000000"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const parseIconsAndGestures = (text: string): React.ReactNode[] => {
  if (!text) return [];
  
  const regex = /(\[PINCH_ICON\]|\[MOUSE_ICON\])/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];
    
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }
    
    if (matchStr.toLowerCase() === '[pinch_icon]') {
      parts.push(
        <span key={`pinch-${matchIndex}`} className="inline-flex items-center justify-center w-[22px] h-[22px] bg-indigo-50 border border-indigo-200/80 rounded-md mx-1.5 align-middle text-[#4F46E5] select-none transition-all hover:scale-110 shadow-sm" title="Pinch zoom / Zoom bysedd">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 3a2.5 2.5 0 0 0-5 0v8a.5.5 0 0 1-1 0V4.5a2.5 2.5 0 0 0-5 0v9a.5.5 0 0 1-1 0V7.5a2.5 2.5 0 0 0-5 0v9c0 4.5 3.5 8 8 8h2a8 8 0 0 0 8-8V5.5c0-1.4-1.1-2.5-2.5-2.5z" />
          </svg>
        </span>
      );
    } else if (matchStr.toLowerCase() === '[mouse_icon]') {
      parts.push(
        <span key={`mouse-${matchIndex}`} className="inline-flex items-center justify-center w-[22px] h-[22px] bg-emerald-50 border border-emerald-200/80 rounded-md mx-1.5 align-middle text-[#059669] select-none transition-all hover:scale-110 shadow-sm" title="Mouse / Llygoden">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="7" />
            <path d="M12 2v6" />
            <path d="M12 11h.01" />
          </svg>
        </span>
      );
    }
    
    lastIndex = matchIndex + matchStr.length;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts;
};

const parseAndReplaceButtons = (segment: string): React.ReactNode[] => {
  if (!segment) return [];
  
  // Regex to match buttons like:
  // (1) DESIGN button, (1) DESIGN, (1) DYLUNIO, (2) CALCULATE, (2) CYFRIFO, (3) SAVE, (3) CADW
  const regex = /(\(1\)\s*DESIGN(?:\s*button)?|\(1\)\s*DYLUNIO|\(2\)\s*CALCULATE|\(2\)\s*CYFRIFO|\(3\)\s*SAVE|\(3\)\s*CADW)/gi;
  
  const tokens: React.ReactNode[] = [];
  let currentIdx = 0;
  let match;
  
  while ((match = regex.exec(segment)) !== null) {
    const matchIdx = match.index;
    const matchStr = match[0];
    
    if (matchIdx > currentIdx) {
      tokens.push(...parseIconsAndGestures(segment.substring(currentIdx, matchIdx)));
    }
    
    const lowerMatch = matchStr.toLowerCase();
    let btnElement: React.ReactNode = null;
    
    if (lowerMatch.includes('1') || lowerMatch.includes('design') || lowerMatch.includes('dylunio')) {
      const isWelsh = lowerMatch.includes('dylunio');
      btnElement = (
        <span key={`btn-1-${matchIdx}`} className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-xl border border-emerald-300 bg-emerald-50 text-stone-900 shadow-[0_1px_3px_rgba(16,185,129,0.15)] scale-95 origin-center align-middle select-none shrink-0 font-sans leading-none">
          <span className="w-4 h-4 rounded-md flex items-center justify-center font-black text-white text-[9px] bg-[#15803D]">1</span>
          <span className="text-[8.5px] font-black uppercase tracking-widest text-[#15803D] leading-none translate-y-[0.5px]">
            {isWelsh ? 'DYLUNIO' : 'DESIGN'}
          </span>
        </span>
      );
    } else if (lowerMatch.includes('2') || lowerMatch.includes('calculate') || lowerMatch.includes('cyfrifo')) {
      const isWelsh = lowerMatch.includes('cyfrifo');
      btnElement = (
        <span key={`btn-2-${matchIdx}`} className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-xl border border-amber-300 bg-amber-50 text-stone-900 shadow-[0_1px_3px_rgba(245,158,11,0.15)] scale-95 origin-center align-middle select-none shrink-0 font-sans leading-none">
          <span className="w-4 h-4 rounded-md flex items-center justify-center font-black text-white text-[9px] bg-[#854D0E]">2</span>
          <span className="text-[8.5px] font-black uppercase tracking-widest text-[#854D0E] leading-none translate-y-[0.5px]">
            {isWelsh ? 'CYFRIFO' : 'CALCULATE'}
          </span>
        </span>
      );
    } else if (lowerMatch.includes('3') || lowerMatch.includes('save') || lowerMatch.includes('cadw')) {
      const isWelsh = lowerMatch.includes('cadw');
      btnElement = (
        <span key={`btn-3-${matchIdx}`} className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-xl border border-orange-300 bg-orange-50 text-stone-900 shadow-[0_1px_3px_rgba(234,88,12,0.15)] scale-95 origin-center align-middle select-none shrink-0 font-sans leading-none">
          <span className="w-4 h-4 rounded-md flex items-center justify-center font-black text-white text-[9px] bg-[#EA580C]">3</span>
          <span className="text-[8.5px] font-black uppercase tracking-widest text-[#EA580C] leading-none translate-y-[0.5px]">
            {isWelsh ? 'CADW' : 'SAVE'}
          </span>
        </span>
      );
    }
    
    if (btnElement) {
      tokens.push(btnElement);
    } else {
      tokens.push(matchStr);
    }
    
    currentIdx = matchIdx + matchStr.length;
  }
  
  if (currentIdx < segment.length) {
    tokens.push(...parseIconsAndGestures(segment.substring(currentIdx)));
  }
  
  return tokens;
};

const renderFormattedText = (text: string) => {
  if (!text) return '';
  
  // Match substrings enclosed in double quotes or curly quotes
  const regex = /("[^"]+"|[“"][^”"]+[”"])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];
    
    // Add non-matched preceding text
    if (matchIndex > lastIndex) {
      const segment = text.substring(lastIndex, matchIndex);
      parts.push(...parseAndReplaceButtons(segment));
    }
    
    // Extract text in between the quotes
    const innerContent = matchStr.slice(1, -1).trim();
    const lower = innerContent.toLowerCase();
    
    let color = '#059669'; // Default to beautiful Green
    let glowClass = 'text-glow-success';
    
    // Map of keywords to color / glow class representing subsection headers and buttons
    if (lower === 'calculate' || lower === 'cyfrifo') {
      color = '#8B5CF6'; 
      glowClass = 'text-glow-purple';
    } else if (lower === 'shape' || lower === 'siâp' || lower === 'shape types' || lower === 'mathau o siâp') {
      color = '#4F46E5'; // Indigo matching Shape subsection header
      glowClass = 'text-glow-purple';
    } else if (lower === 'size' || lower === 'maint') {
      color = '#df3062'; // Red-pink matching Size subsection header
      glowClass = 'text-glow-pink';
    } else if (lower === 'texture' || lower === 'gwead') {
      color = '#059669'; // Green matching Texture subsection header
      glowClass = 'text-glow-success';
    } else if (lower === 'deformations' || lower === 'anffurfiadau') {
      color = '#D97706'; // Amber matching Deformations subsection header
      glowClass = 'text-glow-yellow';
    } else if (lower === 'appearance' || lower === 'ymddangosiad') {
      color = '#8E44AD'; // Purple matching Appearance subsection header
      glowClass = 'text-glow-purple';
    } else if (lower === 'g-code player' || lower === 'chwaraewr g-god' || lower === 'g-god') {
      color = '#EF4444'; // Red matching G-code player label
      glowClass = 'text-glow-red';
    } else if (lower === 'active command' || lower === 'gorchymyn gweithredol') {
      color = '#8B5CF6'; // purple matching Active Command panel text
      glowClass = 'text-glow-purple';
    } else if (lower === 'description' || lower === 'disgrifiad') {
      color = '#FF6FD8'; // pink matching description panel text
      glowClass = 'text-glow-pink';
    } else if (lower === 'g-code command' || lower === 'gorchymyn g-god') {
      color = '#D97706'; // amber matching G-code Command subsection
      glowClass = 'text-glow-yellow';
    } else if (lower === 'g-code command description' || lower === 'disgrifiad gorchymyn g-god') {
      color = '#8E44AD'; // purple matching G-code Description subsection
      glowClass = 'text-glow-purple';
    } else if (lower === 'playback progress' || lower === 'cynnydd chwarae') {
      color = '#0D9488'; // teal matching stats progress bar 
      glowClass = 'text-glow-cyan';
    } else if (lower === 'save g-code' || lower === 'cadw g-cod') {
      color = '#EA580C'; // Orange matching Save G-code button
      glowClass = 'text-glow-yellow';
    } else if (lower === 'save as .cup file' || lower === 'cadw fel ffeil .cup') {
      color = '#4F46E5'; // Indigo matching Save as .cup button
      glowClass = 'text-glow-purple';
    } else if (lower === 'stl preview' || lower === 'rhagolwg stl') {
      color = '#10B981'; // green matching STL Preview button
      glowClass = 'text-glow-success';
    } else if (lower === 'stl quality' || lower === 'ansawdd stl') {
      color = '#10B981'; // green matching STL Quality slider
      glowClass = 'text-glow-success';
    } else if (lower === 'save as a solid model' || lower === 'cadw fel model solat') {
      color = '#10B981'; // green matching Save solid model button
      glowClass = 'text-glow-success';
    } else if (lower === 'save picture' || lower === 'cadw llun') {
      color = '#9333EA'; // purple matching Save Picture button
      glowClass = 'text-glow-purple';
    } else if (lower === '3d printer settings' || lower === 'gosodiadau argraffydd 3d') {
      color = '#10B981'; // green matching settings section
      glowClass = 'text-glow-success';
    } else if (lower === 'model settings' || lower === 'gosodiadau model' || lower === 'meintiau diofyn y model' || lower === 'model default sizes') {
      color = '#2563EB'; // blue matching model defaults section
      glowClass = 'text-glow-cyan';
    } else if (
      lower === 'layer height' || lower === 'uchder haen' || 
      lower === 'print speed' || lower === 'cyflymder argraffu' || 
      lower === 'temperatures' || lower === 'tymheredd' || 
      lower === 'descriptions' || lower === 'disgrifiadau' || 
      lower === 'apply settings' || lower === 'gweithredu gosodiadau' ||
      lower === '3d printer' || lower === 'argraffydd 3d' ||
      lower === 'app preferences' || lower === 'dewisiadau\'r ap' || lower === 'dewisiadau app'
    ) {
      color = '#10B981'; // Green 
      glowClass = 'text-glow-success';
    } else if (lower === '3d print' || lower === 'argraffu 3d') {
      color = '#10B981'; 
      glowClass = 'text-glow-success';
    }
    
    parts.push(
      <span key={matchIndex} className="inline-block whitespace-nowrap">
        <span className="text-slate-950">"</span>
        <span style={{ color }} className={`font-extrabold ${glowClass} inline-block`}>
          {innerContent}
        </span>
        <span className="text-slate-950">"</span>
      </span>
    );
    
    lastIndex = matchIndex + matchStr.length;
  }
  
  if (lastIndex < text.length) {
    const segment = text.substring(lastIndex);
    parts.push(...parseAndReplaceButtons(segment));
  }
  
  return parts;
};

interface FaceLayout {
  path: string;
  featureOffset: { x: number; y: number };
}

const getFaceLayout = (
  collisionDir: 'left' | 'right' | 'top' | 'bottom' | null,
  isHighSpeedFlattened: boolean,
  flattenedDir: 'left' | 'right' | 'top' | 'bottom' | null,
  isMediumSpeedFlattened?: boolean
): FaceLayout => {
  const R = 44;
  const cx = 50;
  const cy = 50;

  // Determine active direction and flat depth
  let activeDir: 'left' | 'right' | 'top' | 'bottom' | null = null;
  let flatDepth = 0;

  if (isHighSpeedFlattened && flattenedDir) {
    activeDir = flattenedDir;
    flatDepth = 17; // Level 3: Larger deformation for high speed hit (17px flat depth)
  } else if (isMediumSpeedFlattened && flattenedDir) {
    activeDir = flattenedDir;
    flatDepth = 7; // Level 2: Some deformation for medium speed hit (7px flat depth)
  } else if (collisionDir) {
    activeDir = collisionDir;
    flatDepth = 7;  // Level 2: Some deformation for medium speed hit (7px flat depth)
  }

  if (!activeDir) {
    // Normal perfect circle
    return {
      path: `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.1} ${cy - R} Z`,
      featureOffset: { x: 0, y: 0 }
    };
  }

  const f = R - flatDepth; // distance from center to flat line
  const halfChord = Math.sqrt(R * R - f * f);

  let path = '';
  // Offset eyes/mouth slightly away from flat wall to create squishing tension
  const offsetDistance = flatDepth * 0.4375;
  let featureOffset = { x: 0, y: 0 };

  if (activeDir === 'bottom') {
    const y0 = cy + f;
    const x1 = cx - halfChord;
    const x2 = cx + halfChord;
    path = `M ${x1} ${y0} L ${x2} ${y0} A ${R} ${R} 0 1 0 ${x1} ${y0}`;
    featureOffset = { x: 0, y: -offsetDistance };
  } else if (activeDir === 'top') {
    const y0 = cy - f;
    const x1 = cx - halfChord;
    const x2 = cx + halfChord;
    path = `M ${x1} ${y0} L ${x2} ${y0} A ${R} ${R} 0 1 1 ${x1} ${y0}`;
    featureOffset = { x: 0, y: offsetDistance };
  } else if (activeDir === 'left') {
    const x0 = cx - f;
    const y1 = cy - halfChord;
    const y2 = cy + halfChord;
    path = `M ${x0} ${y1} L ${x0} ${y2} A ${R} ${R} 0 1 0 ${x0} ${y1}`;
    featureOffset = { x: offsetDistance, y: 0 };
  } else if (activeDir === 'right') {
    const x0 = cx + f;
    const y1 = cy - halfChord;
    const y2 = cy + halfChord;
    path = `M ${x0} ${y2} L ${x0} ${y1} A ${R} ${R} 0 1 0 ${x0} ${y2}`;
    featureOffset = { x: -offsetDistance, y: 0 };
  }

  return { path, featureOffset };
};

export const CursorSmiley = ({ 
  activeTab, 
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  showSettings,
  language = 'en',
  setLanguage,
  params,
  highlightedSection,
  setHighlightedSection,
  setActiveTab,
  setShowSettings
}: { 
  activeTab: string; 
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  showSettings: boolean;
  language?: 'en' | 'cy';
  setLanguage: (lang: 'en' | 'cy') => void;
  params?: ModelParams;
  highlightedSection?: string | null;
  setHighlightedSection?: (s: string | null) => void;
  setActiveTab?: (tab: 'model' | 'gcode' | 'save') => void;
  setShowSettings?: (show: boolean) => void;
}) => {
  const messagesMap = DEFAULT_MESSAGES_MAP;

  const [mode, setMode] = useState<string>('idle');
  const [index, setIndex] = useState(0);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [typedText, setTypedText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isOverViewWindow, setIsOverViewWindow] = useState(false);

  // Synchronization Morph and Color States
  const [morphedShape, setMorphedShape] = useState<ShapeType | null>(null);
  const [morphedColor, setMorphedColor] = useState<string | null>(null);

  const prevShapeTypeRef = useRef<ShapeType | undefined>(undefined);
  const prevSidesRef = useRef<number | undefined>(undefined);
  const prevStarRatioRef = useRef<number | undefined>(undefined);
  const prevFlowerDepthRef = useRef<number | undefined>(undefined);
  const prevGearDepthRef = useRef<number | undefined>(undefined);
  const prevColorRef = useRef<string | undefined>(undefined);

  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const colorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Deformation states
  const [morphedDeform, setMorphedDeform] = useState<ModelParams | null>(null);
  const [morphedDeformField, setMorphedDeformField] = useState<'rotation' | 'draftAngle' | 'bulge' | 'cornerRadius' | null>(null);
  const deformTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prevRotationRef = useRef<number | undefined>(undefined);
  const prevDraftAngleRef = useRef<number | undefined>(undefined);
  const prevBulgeRef = useRef<number | undefined>(undefined);
  const prevTaperSplitRef = useRef<number | undefined>(undefined);
  const prevTwistSplitRef = useRef<number | undefined>(undefined);
  const prevBulgeSplitRef = useRef<number | undefined>(undefined);
  const prevCornerRadiusRef = useRef<number | undefined>(undefined);

  // Texture states
  const [morphedTexture, setMorphedTexture] = useState<TextureType | null>(null);
  const [morphedTextureReverse, setMorphedTextureReverse] = useState<boolean>(false);
  const [morphedTextureFade, setMorphedTextureFade] = useState<boolean>(true);
  const textureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prevTextureTypeRef = useRef<TextureType | undefined>(undefined);
  const prevReverseTextureRef = useRef<boolean | undefined>(undefined);
  const prevFadeTextureRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (!params) return;

    const currentShapeType = params.shapeType;
    const currentSides = params.sides;
    const currentStarRatio = params.starInnerRadiusRatio;
    const currentFlowerDepth = params.flowerPetalDepth;
    const currentGearDepth = params.gearToothDepth;
    const currentColor = params.color;

    const currentRotation = params.rotation;
    const currentDraftAngle = params.draftAngle;
    const currentBulge = params.bulge;
    const currentTaperSplit = params.taperSplitPoint;
    const currentTwistSplit = params.twistSplitPoint;
    const currentBulgeSplit = params.bulgeSplitPoint;
    const currentCornerRadius = params.cornerRadius;

    const currentTextureType = params.textureType;
    const currentReverseTexture = params.reverseTexture;
    const currentFadeTexture = params.fadeTexture;

    // Detect shape parameter changes (after initial load)
    if (prevShapeTypeRef.current !== undefined) {
      if (
        prevShapeTypeRef.current !== currentShapeType ||
        prevSidesRef.current !== currentSides ||
        prevStarRatioRef.current !== currentStarRatio ||
        prevFlowerDepthRef.current !== currentFlowerDepth ||
        prevGearDepthRef.current !== currentGearDepth
      ) {
        setMorphedShape(currentShapeType);
        if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
        shapeTimeoutRef.current = setTimeout(() => {
          setMorphedShape(null);
        }, 1000);
      }
    }

    // Detect color parameter changes (after initial load)
    if (prevColorRef.current !== undefined) {
      if (prevColorRef.current !== currentColor) {
        setMorphedColor(currentColor);
        if (colorTimeoutRef.current) clearTimeout(colorTimeoutRef.current);
        colorTimeoutRef.current = setTimeout(() => {
          setMorphedColor(null);
        }, 1000);
      }
    }

    // Detect deformation parameter changes (after initial load)
    if (prevRotationRef.current !== undefined) {
      let changedField: 'rotation' | 'draftAngle' | 'bulge' | 'cornerRadius' | null = null;
      if (prevRotationRef.current !== currentRotation || prevTwistSplitRef.current !== currentTwistSplit) {
        changedField = 'rotation';
      } else if (prevDraftAngleRef.current !== currentDraftAngle || prevTaperSplitRef.current !== currentTaperSplit) {
        changedField = 'draftAngle';
      } else if (prevBulgeRef.current !== currentBulge || prevBulgeSplitRef.current !== currentBulgeSplit) {
        changedField = 'bulge';
      } else if (prevCornerRadiusRef.current !== currentCornerRadius) {
        changedField = 'cornerRadius';
      }

      if (changedField) {
        setMorphedDeform(params);
        setMorphedDeformField(changedField);
        if (deformTimeoutRef.current) clearTimeout(deformTimeoutRef.current);
        deformTimeoutRef.current = setTimeout(() => {
          setMorphedDeform(null);
          setMorphedDeformField(null);
        }, 1000);
      }
    }

    // Detect texture parameter changes (after initial load)
    if (prevTextureTypeRef.current !== undefined) {
      if (
        prevTextureTypeRef.current !== currentTextureType ||
        prevReverseTextureRef.current !== currentReverseTexture ||
        prevFadeTextureRef.current !== currentFadeTexture
      ) {
        setMorphedTexture(currentTextureType);
        setMorphedTextureReverse(currentReverseTexture);
        setMorphedTextureFade(currentFadeTexture);
        if (textureTimeoutRef.current) clearTimeout(textureTimeoutRef.current);
        textureTimeoutRef.current = setTimeout(() => {
          setMorphedTexture(null);
        }, 1000);
      }
    }

    // Update tracking refs
    prevShapeTypeRef.current = currentShapeType;
    prevSidesRef.current = currentSides;
    prevStarRatioRef.current = currentStarRatio;
    prevFlowerDepthRef.current = currentFlowerDepth;
    prevGearDepthRef.current = currentGearDepth;
    prevColorRef.current = currentColor;

    prevRotationRef.current = currentRotation;
    prevDraftAngleRef.current = currentDraftAngle;
    prevBulgeRef.current = currentBulge;
    prevTaperSplitRef.current = currentTaperSplit;
    prevTwistSplitRef.current = currentTwistSplit;
    prevBulgeSplitRef.current = currentBulgeSplit;
    prevCornerRadiusRef.current = currentCornerRadius;

    prevTextureTypeRef.current = currentTextureType;
    prevReverseTextureRef.current = currentReverseTexture;
    prevFadeTextureRef.current = currentFadeTexture;

    return () => {
      if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
      if (colorTimeoutRef.current) clearTimeout(colorTimeoutRef.current);
      if (deformTimeoutRef.current) clearTimeout(deformTimeoutRef.current);
      if (textureTimeoutRef.current) clearTimeout(textureTimeoutRef.current);
    };
  }, [
    params?.shapeType,
    params?.sides,
    params?.starInnerRadiusRatio,
    params?.flowerPetalDepth,
    params?.gearToothDepth,
    params?.color,
    params?.rotation,
    params?.draftAngle,
    params?.bulge,
    params?.taperSplitPoint,
    params?.twistSplitPoint,
    params?.bulgeSplitPoint,
    params?.cornerRadius,
    params?.textureType,
    params?.reverseTexture,
    params?.fadeTexture
  ]);

  // Sleeping and Giddy States
  const [isSleeping, setIsSleeping] = useState(false);
  const [isYawning, setIsYawning] = useState(false);
  const [isGiddy, setIsGiddy] = useState(false);
  const [giddyLeftOffset, setGiddyLeftOffset] = useState({ x: 0, y: 0 });
  const [giddyRightOffset, setGiddyRightOffset] = useState({ x: 0, y: 0 });

  // Collision state for screen boundaries
  const [collisionDir, setCollisionDir] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
  const collisionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // States for high-speed collision and inflation
  const [isHighSpeedFlattened, setIsHighSpeedFlattened] = useState(false);
  const [isMediumSpeedFlattened, setIsMediumSpeedFlattened] = useState(false);
  const [showStarsAndSad, setShowStarsAndSad] = useState(false);
  const sadStarsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [flattenedDir, setFlattenedDir] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
  const [isInflating, setIsInflating] = useState(false);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inflationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isDraggingState, setIsDraggingState] = useState(false);
  const isDraggingRef = useRef(false);

  // Tickle state & refs
  const [isTickled, setIsTickled] = useState(false);
  const [tickleText, setTickleText] = useState('');
  const [customAlert, setCustomAlert] = useState<{ text: string; textCy: string } | null>(null);
  const rubLastTimeRef = useRef(0);
  const rubLastPosRef = useRef<{ x: number; y: number } | null>(null);
  const tickleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tickleSwapsRef = useRef<number>(0);
  const tickleDirectionRef = useRef<'left' | 'right' | null>(null);
  const lastTickleSwapTimeRef = useRef<number>(0);



  const lastActivityRef = useRef<number>(Date.now());
  const prevSleepingRef = useRef(false);
  const wakeUpYawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const giddyCountRef = useRef(0);
  const lastGiddyRef = useRef<number>(0);
  const lastDirectionChangeRef = useRef<number>(0);
  const currentDirectionRef = useRef<'left' | 'right' | null>(null);
  const directionSwapsRef = useRef<number>(0);
  const lastMouseXRef = useRef<number | null>(null);

  const smileyRef = useRef<HTMLDivElement>(null);
  const playTriggeredRef = useRef(false);

  // Dynamic spring physics state and values
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const dragStartPointerRef = useRef({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });
  const releaseOffsetRef = useRef({ x: 0, y: 0 });

  const raycastHitTypeRef = useRef<'model' | 'gcode' | null>(null);
  const [raycastHitType, setRaycastHitType] = useState<'model' | 'gcode' | null>(null);
  const lastClientXRef = useRef<number>(0);
  const lastClientYRef = useRef<number>(0);

  useEffect(() => {
    const handleRaycastHit = (e: any) => {
      const hit = e.detail?.hitType || null;
      const prev = raycastHitTypeRef.current;
      raycastHitTypeRef.current = hit;
      setRaycastHitType(hit);
      if (hit !== prev && isDraggingState) {
        evaluateHover(lastClientXRef.current, lastClientYRef.current);
      }
    };
    window.addEventListener('smiley-raycast-hit', handleRaycastHit);
    return () => window.removeEventListener('smiley-raycast-hit', handleRaycastHit);
  }, [isDraggingState]);

  useEffect(() => {
    const handleError = () => {
      setCustomAlert({
        text: "Please click the 'Calculate' button in the top bar first before saving the G-Code file.",
        textCy: "Cliciwch ar y botwm 'Cyfrifo' yn y bar uchaf yn gyntaf cyn cadw'r ffeil G-Cod os gwelwch yn dda."
      });
    };
    const handleSaved = () => {
      setCustomAlert({
        text: "Well done, your model is now ready for 3D printing.",
        textCy: "Da iawn, mae eich model bellach yn barod ar gyfer argraffu 3D."
      });
    };
    window.addEventListener('smiley-save-gcode-error', handleError);
    window.addEventListener('smiley-gcode-saved', handleSaved);
    return () => {
      window.removeEventListener('smiley-save-gcode-error', handleError);
      window.removeEventListener('smiley-gcode-saved', handleSaved);
    };
  }, []);

  // Sync offset ref with state
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  // Monitor returning to rest
  useEffect(() => {
    // We are at rest when offset is 0, 0, not dragging, and we have a flattened state
    const isAtRest = offset.x === 0 && offset.y === 0 && !isDraggingState;
    const isAnyFlattened = isHighSpeedFlattened || isMediumSpeedFlattened;

    if (isAnyFlattened && !isInflating && isAtRest) {
      if (!restTimerRef.current) {
        const delay = isHighSpeedFlattened ? 1000 : 400; // faster rest delay for medium speed
        restTimerRef.current = setTimeout(() => {
          setIsInflating(true);
          // Inflation to shape animation duration is reduced by 30%: high (560ms) and medium (280ms)
          if (inflationTimeoutRef.current) clearTimeout(inflationTimeoutRef.current);
          const inflateDuration = isHighSpeedFlattened ? 560 : 280; // reduced by 30% (originally 800/400)
          inflationTimeoutRef.current = setTimeout(() => {
            setIsHighSpeedFlattened(false);
            setIsMediumSpeedFlattened(false);
            setFlattenedDir(null);
            setIsInflating(false);
          }, inflateDuration);
        }, delay);
      }
    } else {
      if (!isAtRest || !isAnyFlattened) {
        if (restTimerRef.current) {
          clearTimeout(restTimerRef.current);
          restTimerRef.current = null;
        }
      }
    }
  }, [offset.x, offset.y, isDraggingState, isHighSpeedFlattened, isMediumSpeedFlattened, isInflating]);

  // Custom high-performance spring physics simulation loop
  useEffect(() => {
    if (isDraggingState) {
      velocityRef.current = { x: 0, y: 0 };
      setCollisionDir(null);
      if (collisionTimeoutRef.current) {
        clearTimeout(collisionTimeoutRef.current);
      }
      return;
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      let dt = (now - lastTime) / 1000;
      lastTime = now;

      if (dt > 0.1) dt = 0.1;

      const currentOffset = offsetRef.current;
      const currentVelocity = velocityRef.current;

      const dist = Math.hypot(currentOffset.x, currentOffset.y);
      const speed = Math.hypot(currentVelocity.x, currentVelocity.y);

      if (dist < 0.1 && speed < 0.1) {
        setOffset({ x: 0, y: 0 });
        velocityRef.current = { x: 0, y: 0 };
        return;
      }

      const stiffness = 240;
      const damping = (mode === 'idle' || mode === 'starting') ? 14 : 35; // reinstate bouncy spring back to resting place, but remain critically damped when docked
      const mass = 1.0;

      const F_spring_x = -stiffness * currentOffset.x;
      const F_spring_y = -stiffness * currentOffset.y;

      const F_damping_x = -damping * currentVelocity.x;
      const F_damping_y = -damping * currentVelocity.y;

      const ax = (F_spring_x + F_damping_x) / mass;
      const ay = (F_spring_y + F_damping_y) / mass;

      let vx = currentVelocity.x + ax * dt;
      let vy = currentVelocity.y + ay * dt;

      let px = currentOffset.x + vx * dt;
      let py = currentOffset.y + vy * dt;

      let containerLeft = 0;
      let containerTop = 0;
      if (smileyRef.current?.parentElement) {
        const rect = smileyRef.current.parentElement.getBoundingClientRect();
        containerLeft = rect.left;
        containerTop = rect.top;
      } else {
        containerLeft = isSidebarCollapsed ? 16 : 356;
        containerTop = 80;
      }

      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

      const scale = mode === 'starting' ? 1.6 : 1.0;
      const smileyBaseSize = 96;
      const smileySize = smileyBaseSize * scale;
      const borderShift = (smileySize - smileyBaseSize) / 2;

      const minX = -containerLeft + borderShift;
      const maxX = screenWidth - smileyBaseSize - borderShift - containerLeft;
      const minY = -containerTop + borderShift;
      const maxY = screenHeight - smileyBaseSize - borderShift - containerTop;

      const bounciness = 0.6375;
      let hitDir: 'left' | 'right' | 'top' | 'bottom' | null = null;
      let isHighSpeedHit = false;

      // Distance on release from home position
      const rx = Math.abs(releaseOffsetRef.current.x);
      const ry = Math.abs(releaseOffsetRef.current.y);

      // Determine deformation levels based on release distance (instead of speed)
      // Level 1: Under 1/3 of the corresponding screen size -> no deformation
      // Level 2: Over 1/3 of the corresponding screen size -> some deformation
      // Level 3: Over 2/3 of the corresponding screen size -> larger deformation
      const thresholdL1_X = screenWidth / 3;
      const thresholdL2_X = (screenWidth * 2) / 3;
      const thresholdL1_Y = screenHeight / 3;
      const thresholdL2_Y = (screenHeight * 2) / 3;

      if (px < minX) {
        px = minX;
        const speed = Math.abs(currentVelocity.x);
        vx = -vx * bounciness;
        hitDir = 'left';
        if (speed > 300) {
          isHighSpeedHit = true;
        }
      } else if (px > maxX) {
        px = maxX;
        const speed = Math.abs(currentVelocity.x);
        vx = -vx * bounciness;
        hitDir = 'right';
        if (speed > 300) {
          isHighSpeedHit = true;
        }
      }

      if (py < minY) {
        py = minY;
        const speed = Math.abs(currentVelocity.y);
        vy = -vy * bounciness;
        hitDir = 'top';
        if (speed > 300) {
          isHighSpeedHit = true;
        }
      } else if (py > maxY) {
        py = maxY;
        const speed = Math.abs(currentVelocity.y);
        vy = -vy * bounciness;
        hitDir = 'bottom';
        if (speed > 300) {
          isHighSpeedHit = true;
        }
      }

      if (hitDir && (mode === 'idle' || mode === 'starting')) {
        setCollisionDir(hitDir);
        if (isHighSpeedHit) {
          setIsHighSpeedFlattened(true);
          setFlattenedDir(hitDir);
          
          // High speed impact triggers sad mouth and circling stars for 1s
          setShowStarsAndSad(true);
          if (sadStarsTimeoutRef.current) clearTimeout(sadStarsTimeoutRef.current);
          sadStarsTimeoutRef.current = setTimeout(() => {
            setShowStarsAndSad(false);
          }, 1000);
        } else {
          setIsMediumSpeedFlattened(true);
          setFlattenedDir(hitDir);
        }
        if (collisionTimeoutRef.current) {
          clearTimeout(collisionTimeoutRef.current);
        }
        collisionTimeoutRef.current = setTimeout(() => {
          setCollisionDir(null);
        }, 120);
      }

      velocityRef.current = { x: vx, y: vy };
      offsetRef.current = { x: px, y: py };
      setOffset({ x: px, y: py });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDraggingState, isSidebarCollapsed, mode]);

  // Multi-touch & desktop pointer event handlers for interactive dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragStartPointerRef.current = { x: e.clientX, y: e.clientY };
    dragStartOffsetRef.current = { ...offsetRef.current };
    isDraggingRef.current = true;
    setIsDraggingState(true);
    velocityRef.current = { x: 0, y: 0 }; // Instantly catch the smiley in place
    setCollisionDir(null);
    setIsHighSpeedFlattened(false);
    setIsMediumSpeedFlattened(false);
    setShowStarsAndSad(false);
    if (sadStarsTimeoutRef.current) {
      clearTimeout(sadStarsTimeoutRef.current);
      sadStarsTimeoutRef.current = null;
    }
    setFlattenedDir(null);
    setIsInflating(false);
    if (collisionTimeoutRef.current) {
      clearTimeout(collisionTimeoutRef.current);
    }
    if (restTimerRef.current) {
      clearTimeout(restTimerRef.current);
      restTimerRef.current = null;
    }
    if (inflationTimeoutRef.current) {
      clearTimeout(inflationTimeoutRef.current);
      inflationTimeoutRef.current = null;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const evaluateHover = (clientX: number, clientY: number) => {
    const viewWindowRect = document.getElementById('three-view-window')?.getBoundingClientRect();
    const isOverView = !!(viewWindowRect && clientX >= viewWindowRect.left && clientX <= viewWindowRect.right && clientY >= viewWindowRect.top && clientY <= viewWindowRect.bottom);
    setIsOverViewWindow(isOverView);
    window.dispatchEvent(new CustomEvent('smiley-over-view-window', { detail: { isOver: isOverView } }));

    const step1Rect = document.getElementById('step-1')?.getBoundingClientRect();
    const step2Rect = document.getElementById('step-2')?.getBoundingClientRect();
    const step3Rect = document.getElementById('step-3')?.getBoundingClientRect();
    const settingsBtnRect = document.getElementById('settings-button')?.getBoundingClientRect();
    const importBtnRect = document.getElementById('import-container')?.getBoundingClientRect();
    const languageBtnRect = document.getElementById('language-toggle-container')?.getBoundingClientRect();
    const smileyBtnRect = document.getElementById('smiley-toggle-container')?.getBoundingClientRect();

    const isOverStep1Tab = step1Rect && clientX >= step1Rect.left && clientX <= step1Rect.right && clientY >= step1Rect.top && clientY <= step1Rect.bottom;
    const isOverStep2Tab = step2Rect && clientX >= step2Rect.left && clientX <= step2Rect.right && clientY >= step2Rect.top && clientY <= step2Rect.bottom;
    const isOverStep3Tab = step3Rect && clientX >= step3Rect.left && clientX <= step3Rect.right && clientY >= step3Rect.top && clientY <= step3Rect.bottom;
    const isOverSettingsTab = settingsBtnRect && clientX >= settingsBtnRect.left && clientX <= settingsBtnRect.right && clientY >= settingsBtnRect.top && clientY <= settingsBtnRect.bottom;
    const isOverImportBtn = importBtnRect && clientX >= importBtnRect.left && clientX <= importBtnRect.right && clientY >= importBtnRect.top && clientY <= importBtnRect.bottom;
    const isOverLanguageBtn = languageBtnRect && clientX >= languageBtnRect.left && clientX <= languageBtnRect.right && clientY >= languageBtnRect.top && clientY <= languageBtnRect.bottom;
    const isOverSmileyBtn = smileyBtnRect && clientX >= smileyBtnRect.left && clientX <= smileyBtnRect.right && clientY >= smileyBtnRect.top && clientY <= smileyBtnRect.bottom;

    const designRect = document.getElementById('design-section-container')?.getBoundingClientRect();
    const gcodeRect = document.getElementById('gcode-section-container')?.getBoundingClientRect();
    const settingsRect = document.getElementById('settings-section-container')?.getBoundingClientRect();

    const isOverDesignSection = designRect && clientX >= designRect.left && clientX <= designRect.right && clientY >= designRect.top && clientY <= designRect.bottom;
    const isOverGcodeSection = gcodeRect && clientX >= gcodeRect.left && clientX <= gcodeRect.right && clientY >= gcodeRect.top && clientY <= gcodeRect.bottom;
    const isOverSettingsSection = settingsRect && clientX >= settingsRect.left && clientX <= settingsRect.right && clientY >= settingsRect.top && clientY <= settingsRect.bottom;

    const saveTitleRect = document.getElementById('save-title-container')?.getBoundingClientRect();
    const settingsTitleRect = document.getElementById('settings-title-container')?.getBoundingClientRect();
    const designTitleRect = document.getElementById('design-title-container')?.getBoundingClientRect();
    const gcodeTitleRect = document.getElementById('gcode-title-container')?.getBoundingClientRect();

    const isOverSaveTitle = saveTitleRect && clientX >= saveTitleRect.left && clientX <= saveTitleRect.right && clientY >= saveTitleRect.top && clientY <= saveTitleRect.bottom;
    const isOverSettingsTitle = settingsTitleRect && clientX >= settingsTitleRect.left && clientX <= settingsTitleRect.right && clientY >= settingsTitleRect.top && clientY <= settingsTitleRect.bottom;
    const isOverDesignTitle = designTitleRect && clientX >= designTitleRect.left && clientX <= designTitleRect.right && clientY >= designTitleRect.top && clientY <= designTitleRect.bottom;
    const isOverGcodeTitle = gcodeTitleRect && clientX >= gcodeTitleRect.left && clientX <= gcodeTitleRect.right && clientY >= gcodeTitleRect.top && clientY <= gcodeTitleRect.bottom;

    // Subsections
    const saveNameRect = document.getElementById('subsec-save-name-container')?.getBoundingClientRect();
    const saveGuideRect = document.getElementById('subsec-save-guide-container')?.getBoundingClientRect();
    const saveModelCupRect = document.getElementById('subsec-save-model-cup-container')?.getBoundingClientRect();
    const saveModelStlRect = document.getElementById('subsec-save-model-stl-container')?.getBoundingClientRect();
    const savePictureRect = document.getElementById('subsec-save-picture-container')?.getBoundingClientRect();

    const sizeRect = document.getElementById('subsec-size-container')?.getBoundingClientRect();
    const shapeRect = document.getElementById('subsec-shape-container')?.getBoundingClientRect();
    const textureRect = document.getElementById('subsec-texture-container')?.getBoundingClientRect();
    const ribRect = (document.getElementById('subsec-rib-container') || document.getElementById('subsec-ribs-container'))?.getBoundingClientRect();
    const deformRect = document.getElementById('subsec-deformations-container')?.getBoundingClientRect();
    const appearanceRect = document.getElementById('subsec-appearance-container')?.getBoundingClientRect();

    const printerSetRect = document.getElementById('subsec-printer-settings-container')?.getBoundingClientRect();
    const modelSizesRect = document.getElementById('subsec-model-sizes-container')?.getBoundingClientRect();

    const playbackRect = document.getElementById('gcode-player-tour-target')?.getBoundingClientRect();
    const statsRect = document.getElementById('subsec-playback-stats-container')?.getBoundingClientRect();
    const commandRect = document.getElementById('subsec-gcode-command-container')?.getBoundingClientRect();
    const descriptionRect = document.getElementById('subsec-gcode-description-container')?.getBoundingClientRect();

    // 3D HUD containers
    const buildVol3dRect = document.getElementById('subsec-3d-build-volume-container')?.getBoundingClientRect();
    const model3dRect = document.getElementById('subsec-3d-model-container')?.getBoundingClientRect();
    const path3dRect = document.getElementById('subsec-3d-path-container')?.getBoundingClientRect();
    const base3dRect = document.getElementById('subsec-3d-printer-base-container')?.getBoundingClientRect();
    const coord3dRect = document.getElementById('subsec-3d-coordinate-system-container')?.getBoundingClientRect();
    const grid3dRect = document.getElementById('subsec-3d-grid-container')?.getBoundingClientRect();
    const viewCtrlRect = document.getElementById('subsec-view-control-container')?.getBoundingClientRect();
    const modelInfoRect = document.getElementById('subsec-model-info-container')?.getBoundingClientRect();

    const viewItemViewsRect = document.getElementById('subsec-view-item-views')?.getBoundingClientRect();
    const viewItemView3dRect = document.getElementById('subsec-view-item-view-3d')?.getBoundingClientRect();
    const viewItemViewTopRect = document.getElementById('subsec-view-item-view-top')?.getBoundingClientRect();
    const viewItemViewFrontRect = document.getElementById('subsec-view-item-view-front')?.getBoundingClientRect();
    const viewItemViewRightRect = document.getElementById('subsec-view-item-view-right')?.getBoundingClientRect();
    const viewItemGridRect = document.getElementById('subsec-view-item-grid')?.getBoundingClientRect();
    const viewItemBaseplateRect = document.getElementById('subsec-view-item-baseplate')?.getBoundingClientRect();
    const viewItemAxisRect = document.getElementById('subsec-view-item-axis')?.getBoundingClientRect();
    const viewItemBuildvolumeRect = document.getElementById('subsec-view-item-buildvolume')?.getBoundingClientRect();

    let hovered: string | null = null;
    const gcodeTextureRect = document.getElementById('subsec-gcode-texture-container')?.getBoundingClientRect();
    const isOverViews = (viewItemViewsRect && clientX >= viewItemViewsRect.left && clientX <= viewItemViewsRect.right && clientY >= viewItemViewsRect.top && clientY <= viewItemViewsRect.bottom) ||
      (viewItemView3dRect && clientX >= viewItemView3dRect.left && clientX <= viewItemView3dRect.right && clientY >= viewItemView3dRect.top && clientY <= viewItemView3dRect.bottom) ||
      (viewItemViewTopRect && clientX >= viewItemViewTopRect.left && clientX <= viewItemViewTopRect.right && clientY >= viewItemViewTopRect.top && clientY <= viewItemViewTopRect.bottom) ||
      (viewItemViewFrontRect && clientX >= viewItemViewFrontRect.left && clientX <= viewItemViewFrontRect.right && clientY >= viewItemViewFrontRect.top && clientY <= viewItemViewFrontRect.bottom) ||
      (viewItemViewRightRect && clientX >= viewItemViewRightRect.left && clientX <= viewItemViewRightRect.right && clientY >= viewItemViewRightRect.top && clientY <= viewItemViewRightRect.bottom);

    if (isOverViews) {
      hovered = 'subsec_3d_view_control_hover';
    } else if (viewItemGridRect && clientX >= viewItemGridRect.left && clientX <= viewItemGridRect.right && clientY >= viewItemGridRect.top && clientY <= viewItemGridRect.bottom) {
      hovered = 'subsec_3d_grid_hover';
    } else if (viewItemBaseplateRect && clientX >= viewItemBaseplateRect.left && clientX <= viewItemBaseplateRect.right && clientY >= viewItemBaseplateRect.top && clientY <= viewItemBaseplateRect.bottom) {
      hovered = 'subsec_3d_printer_base_hover';
    } else if (viewItemAxisRect && clientX >= viewItemAxisRect.left && clientX <= viewItemAxisRect.right && clientY >= viewItemAxisRect.top && clientY <= viewItemAxisRect.bottom) {
      hovered = 'subsec_3d_coordinate_system_hover';
    } else if (viewItemBuildvolumeRect && clientX >= viewItemBuildvolumeRect.left && clientX <= viewItemBuildvolumeRect.right && clientY >= viewItemBuildvolumeRect.top && clientY <= viewItemBuildvolumeRect.bottom) {
      hovered = 'subsec_3d_build_volume_hover';
    } else if (saveNameRect && clientX >= saveNameRect.left && clientX <= saveNameRect.right && clientY >= saveNameRect.top && clientY <= saveNameRect.bottom) {
      hovered = 'subsec-save-name';
    } else if (saveGuideRect && clientX >= saveGuideRect.left && clientX <= saveGuideRect.right && clientY >= saveGuideRect.top && clientY <= saveGuideRect.bottom) {
      hovered = 'subsec-save-guide';
    } else if (saveModelCupRect && clientX >= saveModelCupRect.left && clientX <= saveModelCupRect.right && clientY >= saveModelCupRect.top && clientY <= saveModelCupRect.bottom) {
      hovered = 'subsec-save-model-cup';
    } else if (saveModelStlRect && clientX >= saveModelStlRect.left && clientX <= saveModelStlRect.right && clientY >= saveModelStlRect.top && clientY <= saveModelStlRect.bottom) {
      hovered = 'subsec-save-model-stl';
    } else if (savePictureRect && clientX >= savePictureRect.left && clientX <= savePictureRect.right && clientY >= savePictureRect.top && clientY <= savePictureRect.bottom) {
      hovered = 'subsec-save-picture';
    } else if (sizeRect && clientX >= sizeRect.left && clientX <= sizeRect.right && clientY >= sizeRect.top && clientY <= sizeRect.bottom) {
      hovered = 'subsec-size';
    } else if (shapeRect && clientX >= shapeRect.left && clientX <= shapeRect.right && clientY >= shapeRect.top && clientY <= shapeRect.bottom) {
      hovered = 'subsec-shape';
    } else if (textureRect && clientX >= textureRect.left && clientX <= textureRect.right && clientY >= textureRect.top && clientY <= textureRect.bottom) {
      hovered = 'subsec-texture';
    } else if (ribRect && clientX >= ribRect.left && clientX <= ribRect.right && clientY >= ribRect.top && clientY <= ribRect.bottom) {
      hovered = 'subsec-ribs';
    } else if (deformRect && clientX >= deformRect.left && clientX <= deformRect.right && clientY >= deformRect.top && clientY <= deformRect.bottom) {
      hovered = 'subsec-deformations';
    } else if (appearanceRect && clientX >= appearanceRect.left && clientX <= appearanceRect.right && clientY >= appearanceRect.top && clientY <= appearanceRect.bottom) {
      hovered = 'subsec-appearance';
    } else if (printerSetRect && clientX >= printerSetRect.left && clientX <= printerSetRect.right && clientY >= printerSetRect.top && clientY <= printerSetRect.bottom) {
      hovered = 'subsec-printer-settings';
    } else if (modelSizesRect && clientX >= modelSizesRect.left && clientX <= modelSizesRect.right && clientY >= modelSizesRect.top && clientY <= modelSizesRect.bottom) {
      hovered = 'subsec-model-sizes';
    } else if (playbackRect && clientX >= playbackRect.left && clientX <= playbackRect.right && clientY >= playbackRect.top && clientY <= playbackRect.bottom) {
      hovered = 'subsec-gcode-playback';
    } else if (gcodeTextureRect && clientX >= gcodeTextureRect.left && clientX <= gcodeTextureRect.right && clientY >= gcodeTextureRect.top && clientY <= gcodeTextureRect.bottom) {
      hovered = 'subsec-gcode-texture';
    } else if (statsRect && clientX >= statsRect.left && clientX <= statsRect.right && clientY >= statsRect.top && clientY <= statsRect.bottom) {
      hovered = 'subsec-gcode-stats';
    } else if (commandRect && clientX >= commandRect.left && clientX <= commandRect.right && clientY >= commandRect.top && clientY <= commandRect.bottom) {
      hovered = 'subsec-gcode-command';
    } else if (descriptionRect && clientX >= descriptionRect.left && clientX <= descriptionRect.right && clientY >= descriptionRect.top && clientY <= descriptionRect.bottom) {
      hovered = 'subsec-gcode-description';
    } else if (buildVol3dRect && clientX >= buildVol3dRect.left && clientX <= buildVol3dRect.right && clientY >= buildVol3dRect.top && clientY <= buildVol3dRect.bottom) {
      hovered = 'subsec_3d_build_volume_hover';
    } else if (model3dRect && clientX >= model3dRect.left && clientX <= model3dRect.right && clientY >= model3dRect.top && clientY <= model3dRect.bottom) {
      hovered = 'subsec_3d_model_hover';
    } else if (path3dRect && clientX >= path3dRect.left && clientX <= path3dRect.right && clientY >= path3dRect.top && clientY <= path3dRect.bottom) {
      hovered = 'subsec_3d_path_hover';
    } else if (base3dRect && clientX >= base3dRect.left && clientX <= base3dRect.right && clientY >= base3dRect.top && clientY <= base3dRect.bottom) {
      hovered = 'subsec_3d_printer_base_hover';
    } else if (coord3dRect && clientX >= coord3dRect.left && clientX <= coord3dRect.right && clientY >= coord3dRect.top && clientY <= coord3dRect.bottom) {
      hovered = 'subsec_3d_coordinate_system_hover';
    } else if (grid3dRect && clientX >= grid3dRect.left && clientX <= grid3dRect.right && clientY >= grid3dRect.top && clientY <= grid3dRect.bottom) {
      hovered = 'subsec_3d_grid_hover';
    } else if (viewCtrlRect && clientX >= viewCtrlRect.left && clientX <= viewCtrlRect.right && clientY >= viewCtrlRect.top && clientY <= viewCtrlRect.bottom) {
      hovered = 'subsec_3d_view_control_hover';
    } else if (modelInfoRect && clientX >= modelInfoRect.left && clientX <= modelInfoRect.right && clientY >= modelInfoRect.top && clientY <= modelInfoRect.bottom) {
      hovered = 'subsec_3d_model_info_hover';
    } else if (isOverView) {
      if (activeTab === 'model') {
        if (raycastHitTypeRef.current === 'model') {
          hovered = 'subsec_3d_model_hover';
        } else {
          hovered = null;
        }
      } else if (activeTab === 'gcode') {
        if (raycastHitTypeRef.current === 'gcode') {
          hovered = 'subsec_3d_path_hover';
        } else {
          hovered = null;
        }
      }
    } else if (isOverImportBtn) {
      hovered = 'subsec_import_hover';
    } else if (isOverLanguageBtn) {
      hovered = 'subsec_language_hover';
    } else if (isOverSmileyBtn) {
      hovered = 'subsec_smiley_hover';
    } else if (isOverStep3Tab) {
      hovered = 'save';
    } else if (isOverStep1Tab || isOverDesignSection) {
      hovered = 'design';
    } else if (isOverStep2Tab || isOverGcodeSection) {
      hovered = 'gcode';
    } else if (isOverSettingsTab || isOverSettingsSection) {
      hovered = 'settings';
    }

    if (setHighlightedSection) {
      setHighlightedSection(hovered);
    }
  };

  const triggerTickle = () => {
    if (!isTickled) {
      setIsTickled(true);
      const msgs = [
        { text: "Hehehe! That tickles! 😆", textCy: "Hehehe! Mae hynny'n goglais! 😆" },
        { text: "Hahaha! Stop it! 😂", textCy: "Hahaha! Rho'r gorau iddi! 😂" },
        { text: "Aha-ha! You found my weak spot! 😋", textCy: "Aha-ha! Rydych chi wedi ganfod fy lle gwan! 😋" },
        { text: "Pfft-hahaha! Ooh, so ticklish! 🤣", textCy: "Pfft-hahaha! Ooh, mor goglyd! 🤣" },
      ];
      const selected = msgs[Math.floor(Math.random() * msgs.length)];
      setTickleText(language === 'cy' ? selected.textCy : selected.text);
    }

    if (tickleTimeoutRef.current) {
      clearTimeout(tickleTimeoutRef.current);
    }

    tickleTimeoutRef.current = setTimeout(() => {
      setIsTickled(false);
      tickleSwapsRef.current = 0;
    }, 1400);
  };

  useEffect(() => {
    return () => {
      if (tickleTimeoutRef.current) clearTimeout(tickleTimeoutRef.current);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Rubbing / Tickle Detection via rapid back-and-forth direction changes (swaps)
    const now = Date.now();
    const x = e.clientX;
    const y = e.clientY;

    if (rubLastPosRef.current && rubLastTimeRef.current) {
      const dt = now - rubLastTimeRef.current;
      const dx = x - rubLastPosRef.current.x;
      const dy = y - rubLastPosRef.current.y;
      const dist = Math.hypot(dx, dy);

      // Require significant movement to avoid jitter noise (e.g. at least 3.5px)
      if (dt < 250 && dist > 3.5) {
        const currentDir = dx > 0 ? 'right' : 'left';
        
        if (tickleDirectionRef.current && tickleDirectionRef.current !== currentDir) {
          const timeSinceSwap = now - lastTickleSwapTimeRef.current;
          // Must swap direction within 450ms for it to be a rapid "rubbing/tickling" motion
          if (timeSinceSwap < 450) {
            tickleSwapsRef.current += 1;
            if (tickleSwapsRef.current >= 4) {
              triggerTickle();
              tickleSwapsRef.current = 0;
            }
          } else {
            tickleSwapsRef.current = 1;
          }
          lastTickleSwapTimeRef.current = now;
        }
        tickleDirectionRef.current = currentDir;
      }

      // Reset the swaps tracker if they stop rubbing for more than 1.0s
      if (now - lastTickleSwapTimeRef.current > 1000) {
        tickleSwapsRef.current = 0;
      }
    }
    rubLastPosRef.current = { x, y };
    rubLastTimeRef.current = now;

    if (!isDraggingState) return;
    const dx = e.clientX - dragStartPointerRef.current.x;
    const dy = e.clientY - dragStartPointerRef.current.y;
    const newX = dragStartOffsetRef.current.x + dx;
    const newY = dragStartOffsetRef.current.y + dy;
    offsetRef.current = { x: newX, y: newY };
    setOffset({ x: newX, y: newY });

    const clientX = e.clientX;
    const clientY = e.clientY;

    lastClientXRef.current = clientX;
    lastClientYRef.current = clientY;

    // Dispatch coordinates to 3D Viewport Raycaster
    window.dispatchEvent(new CustomEvent('smiley-drag-move', {
      detail: {
        clientX,
        clientY,
        isDragging: true,
        activeTab
      }
    }));

    evaluateHover(clientX, clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    releaseOffsetRef.current = { ...offsetRef.current };
    setIsDraggingState(false);
    
    // Dispatch end of drag event to reset 3D Viewport tracking
    window.dispatchEvent(new CustomEvent('smiley-drag-move', {
      detail: {
        clientX: 0,
        clientY: 0,
        isDragging: false,
        activeTab
      }
    }));

    e.currentTarget.releasePointerCapture(e.pointerId);

    const totalDragDistance = Math.hypot(
      e.clientX - dragStartPointerRef.current.x,
      e.clientY - dragStartPointerRef.current.y
    );

    if (totalDragDistance < 5) {
      isDraggingRef.current = false;
    } else {
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 80);
    }

    // Direct geometric computation at release time to prevent stale closure state
    const clientX = e.clientX;
    const clientY = e.clientY;

    const step1Rect = document.getElementById('step-1')?.getBoundingClientRect();
    const step2Rect = document.getElementById('step-2')?.getBoundingClientRect();
    const step3Rect = document.getElementById('step-3')?.getBoundingClientRect();
    const settingsBtnRect = document.getElementById('settings-button')?.getBoundingClientRect();
    const importBtnRect = document.getElementById('import-container')?.getBoundingClientRect();
    const languageBtnRect = document.getElementById('language-toggle-container')?.getBoundingClientRect();
    const smileyBtnRect = document.getElementById('smiley-toggle-container')?.getBoundingClientRect();

    const isOverStep1Tab = step1Rect && clientX >= step1Rect.left && clientX <= step1Rect.right && clientY >= step1Rect.top && clientY <= step1Rect.bottom;
    const isOverStep2Tab = step2Rect && clientX >= step2Rect.left && clientX <= step2Rect.right && clientY >= step2Rect.top && clientY <= step2Rect.bottom;
    const isOverStep3Tab = step3Rect && clientX >= step3Rect.left && clientX <= step3Rect.right && clientY >= step3Rect.top && clientY <= step3Rect.bottom;
    const isOverSettingsTab = settingsBtnRect && clientX >= settingsBtnRect.left && clientX <= settingsBtnRect.right && clientY >= settingsBtnRect.top && clientY <= settingsBtnRect.bottom;
    const isOverImportBtn = importBtnRect && clientX >= importBtnRect.left && clientX <= importBtnRect.right && clientY >= importBtnRect.top && clientY <= importBtnRect.bottom;
    const isOverLanguageBtn = languageBtnRect && clientX >= languageBtnRect.left && clientX <= languageBtnRect.right && clientY >= languageBtnRect.top && clientY <= languageBtnRect.bottom;
    const isOverSmileyBtn = smileyBtnRect && clientX >= smileyBtnRect.left && clientX <= smileyBtnRect.right && clientY >= smileyBtnRect.top && clientY <= smileyBtnRect.bottom;

    const designRect = document.getElementById('design-section-container')?.getBoundingClientRect();
    const gcodeRect = document.getElementById('gcode-section-container')?.getBoundingClientRect();
    const settingsRect = document.getElementById('settings-section-container')?.getBoundingClientRect();

    const isOverDesignSection = designRect && clientX >= designRect.left && clientX <= designRect.right && clientY >= designRect.top && clientY <= designRect.bottom;
    const isOverGcodeSection = gcodeRect && clientX >= gcodeRect.left && clientX <= gcodeRect.right && clientY >= gcodeRect.top && clientY <= gcodeRect.bottom;
    const isOverSettingsSection = settingsRect && clientX >= settingsRect.left && clientX <= settingsRect.right && clientY >= settingsRect.top && clientY <= settingsRect.bottom;

    const saveTitleRect = document.getElementById('save-title-container')?.getBoundingClientRect();
    const settingsTitleRect = document.getElementById('settings-title-container')?.getBoundingClientRect();
    const designTitleRect = document.getElementById('design-title-container')?.getBoundingClientRect();
    const gcodeTitleRect = document.getElementById('gcode-title-container')?.getBoundingClientRect();

    const isOverSaveTitle = saveTitleRect && clientX >= saveTitleRect.left && clientX <= saveTitleRect.right && clientY >= saveTitleRect.top && clientY <= saveTitleRect.bottom;
    const isOverSettingsTitle = settingsTitleRect && clientX >= settingsTitleRect.left && clientX <= settingsTitleRect.right && clientY >= settingsTitleRect.top && clientY <= settingsTitleRect.bottom;
    const isOverDesignTitle = designTitleRect && clientX >= designTitleRect.left && clientX <= designTitleRect.right && clientY >= designTitleRect.top && clientY <= designTitleRect.bottom;
    const isOverGcodeTitle = gcodeTitleRect && clientX >= gcodeTitleRect.left && clientX <= gcodeTitleRect.right && clientY >= gcodeTitleRect.top && clientY <= gcodeTitleRect.bottom;

    // Subsections
    const saveNameRect = document.getElementById('subsec-save-name-container')?.getBoundingClientRect();
    const saveGuideRect = document.getElementById('subsec-save-guide-container')?.getBoundingClientRect();
    const saveModelCupRect = document.getElementById('subsec-save-model-cup-container')?.getBoundingClientRect();
    const saveModelStlRect = document.getElementById('subsec-save-model-stl-container')?.getBoundingClientRect();
    const savePictureRect = document.getElementById('subsec-save-picture-container')?.getBoundingClientRect();

    const sizeRect = document.getElementById('subsec-size-container')?.getBoundingClientRect();
    const shapeRect = document.getElementById('subsec-shape-container')?.getBoundingClientRect();
    const textureRect = document.getElementById('subsec-texture-container')?.getBoundingClientRect();
    const ribRect = (document.getElementById('subsec-rib-container') || document.getElementById('subsec-ribs-container'))?.getBoundingClientRect();
    const deformRect = document.getElementById('subsec-deformations-container')?.getBoundingClientRect();
    const appearanceRect = document.getElementById('subsec-appearance-container')?.getBoundingClientRect();

    const printerSetRect = document.getElementById('subsec-printer-settings-container')?.getBoundingClientRect();
    const modelSizesRect = document.getElementById('subsec-model-sizes-container')?.getBoundingClientRect();

    const playbackRect = document.getElementById('gcode-player-tour-target')?.getBoundingClientRect();
    const statsRect = document.getElementById('subsec-playback-stats-container')?.getBoundingClientRect();
    const commandRect = document.getElementById('subsec-gcode-command-container')?.getBoundingClientRect();
    const descriptionRect = document.getElementById('subsec-gcode-description-container')?.getBoundingClientRect();

    // 3D HUD containers
    const buildVol3dRect = document.getElementById('subsec-3d-build-volume-container')?.getBoundingClientRect();
    const model3dRect = document.getElementById('subsec-3d-model-container')?.getBoundingClientRect();
    const path3dRect = document.getElementById('subsec-3d-path-container')?.getBoundingClientRect();
    const base3dRect = document.getElementById('subsec-3d-printer-base-container')?.getBoundingClientRect();
    const coord3dRect = document.getElementById('subsec-3d-coordinate-system-container')?.getBoundingClientRect();
    const grid3dRect = document.getElementById('subsec-3d-grid-container')?.getBoundingClientRect();
    const viewCtrlRect = document.getElementById('subsec-view-control-container')?.getBoundingClientRect();
    const modelInfoRect = document.getElementById('subsec-model-info-container')?.getBoundingClientRect();

    const viewItemViewsRect = document.getElementById('subsec-view-item-views')?.getBoundingClientRect();
    const viewItemView3dRect = document.getElementById('subsec-view-item-view-3d')?.getBoundingClientRect();
    const viewItemViewTopRect = document.getElementById('subsec-view-item-view-top')?.getBoundingClientRect();
    const viewItemViewFrontRect = document.getElementById('subsec-view-item-view-front')?.getBoundingClientRect();
    const viewItemViewRightRect = document.getElementById('subsec-view-item-view-right')?.getBoundingClientRect();
    const viewItemGridRect = document.getElementById('subsec-view-item-grid')?.getBoundingClientRect();
    const viewItemBaseplateRect = document.getElementById('subsec-view-item-baseplate')?.getBoundingClientRect();
    const viewItemAxisRect = document.getElementById('subsec-view-item-axis')?.getBoundingClientRect();
    const viewItemBuildvolumeRect = document.getElementById('subsec-view-item-buildvolume')?.getBoundingClientRect();

    let viewControlDropItem: string | null = null;
    const isOverViewsDrop = (viewItemViewsRect && clientX >= viewItemViewsRect.left && clientX <= viewItemViewsRect.right && clientY >= viewItemViewsRect.top && clientY <= viewItemViewsRect.bottom) ||
      (viewItemView3dRect && clientX >= viewItemView3dRect.left && clientX <= viewItemView3dRect.right && clientY >= viewItemView3dRect.top && clientY <= viewItemView3dRect.bottom) ||
      (viewItemViewTopRect && clientX >= viewItemViewTopRect.left && clientX <= viewItemViewTopRect.right && clientY >= viewItemViewTopRect.top && clientY <= viewItemViewTopRect.bottom) ||
      (viewItemViewFrontRect && clientX >= viewItemViewFrontRect.left && clientX <= viewItemViewFrontRect.right && clientY >= viewItemViewFrontRect.top && clientY <= viewItemViewFrontRect.bottom) ||
      (viewItemViewRightRect && clientX >= viewItemViewRightRect.left && clientX <= viewItemViewRightRect.right && clientY >= viewItemViewRightRect.top && clientY <= viewItemViewRightRect.bottom);

    if (isOverViewsDrop) {
      viewControlDropItem = 'smiley-drop-views';
    } else if (viewItemGridRect && clientX >= viewItemGridRect.left && clientX <= viewItemGridRect.right && clientY >= viewItemGridRect.top && clientY <= viewItemGridRect.bottom) {
      viewControlDropItem = 'smiley-drop-grid';
    } else if (viewItemBaseplateRect && clientX >= viewItemBaseplateRect.left && clientX <= viewItemBaseplateRect.right && clientY >= viewItemBaseplateRect.top && clientY <= viewItemBaseplateRect.bottom) {
      viewControlDropItem = 'smiley-drop-baseplate';
    } else if (viewItemAxisRect && clientX >= viewItemAxisRect.left && clientX <= viewItemAxisRect.right && clientY >= viewItemAxisRect.top && clientY <= viewItemAxisRect.bottom) {
      viewControlDropItem = 'smiley-drop-axis';
    } else if (viewItemBuildvolumeRect && clientX >= viewItemBuildvolumeRect.left && clientX <= viewItemBuildvolumeRect.right && clientY >= viewItemBuildvolumeRect.top && clientY <= viewItemBuildvolumeRect.bottom) {
      viewControlDropItem = 'smiley-drop-buildvolume';
    }

    let targetSec: string | null = null;
    const gcodeTextureRect = document.getElementById('subsec-gcode-texture-container')?.getBoundingClientRect();
    const viewWindowRect = document.getElementById('three-view-window')?.getBoundingClientRect();
    const isOverView = !!(viewWindowRect && clientX >= viewWindowRect.left && clientX <= viewWindowRect.right && clientY >= viewWindowRect.top && clientY <= viewWindowRect.bottom);

    if (viewControlDropItem) {
      window.dispatchEvent(new CustomEvent(viewControlDropItem));
      if (viewControlDropItem === 'smiley-drop-views') {
        targetSec = 'subsec-3d-view-control';
      } else if (viewControlDropItem === 'smiley-drop-grid') {
        targetSec = 'subsec-3d-grid';
      } else if (viewControlDropItem === 'smiley-drop-baseplate') {
        targetSec = 'subsec-3d-printer-base';
      } else if (viewControlDropItem === 'smiley-drop-axis') {
        targetSec = 'subsec-3d-coordinate-system';
      } else if (viewControlDropItem === 'smiley-drop-buildvolume') {
        targetSec = 'subsec-3d-build-volume';
      }
    } else if (saveNameRect && clientX >= saveNameRect.left && clientX <= saveNameRect.right && clientY >= saveNameRect.top && clientY <= saveNameRect.bottom) {
      targetSec = 'subsec-save-name';
    } else if (saveGuideRect && clientX >= saveGuideRect.left && clientX <= saveGuideRect.right && clientY >= saveGuideRect.top && clientY <= saveGuideRect.bottom) {
      targetSec = 'subsec-save-guide';
    } else if (saveModelCupRect && clientX >= saveModelCupRect.left && clientX <= saveModelCupRect.right && clientY >= saveModelCupRect.top && clientY <= saveModelCupRect.bottom) {
      targetSec = 'subsec-save-model-cup';
    } else if (saveModelStlRect && clientX >= saveModelStlRect.left && clientX <= saveModelStlRect.right && clientY >= saveModelStlRect.top && clientY <= saveModelStlRect.bottom) {
      targetSec = 'subsec-save-model-stl';
    } else if (savePictureRect && clientX >= savePictureRect.left && clientX <= savePictureRect.right && clientY >= savePictureRect.top && clientY <= savePictureRect.bottom) {
      targetSec = 'subsec-save-picture';
    } else if (sizeRect && clientX >= sizeRect.left && clientX <= sizeRect.right && clientY >= sizeRect.top && clientY <= sizeRect.bottom) {
      targetSec = 'subsec-size';
    } else if (shapeRect && clientX >= shapeRect.left && clientX <= shapeRect.right && clientY >= shapeRect.top && clientY <= shapeRect.bottom) {
      targetSec = 'subsec-shape';
    } else if (textureRect && clientX >= textureRect.left && clientX <= textureRect.right && clientY >= textureRect.top && clientY <= textureRect.bottom) {
      targetSec = 'subsec-texture';
    } else if (ribRect && clientX >= ribRect.left && clientX <= ribRect.right && clientY >= ribRect.top && clientY <= ribRect.bottom) {
      targetSec = 'subsec-ribs';
    } else if (deformRect && clientX >= deformRect.left && clientX <= deformRect.right && clientY >= deformRect.top && clientY <= deformRect.bottom) {
      targetSec = 'subsec-deformations';
    } else if (appearanceRect && clientX >= appearanceRect.left && clientX <= appearanceRect.right && clientY >= appearanceRect.top && clientY <= appearanceRect.bottom) {
      targetSec = 'subsec-appearance';
    } else if (printerSetRect && clientX >= printerSetRect.left && clientX <= printerSetRect.right && clientY >= printerSetRect.top && clientY <= printerSetRect.bottom) {
      targetSec = 'subsec-printer-settings';
    } else if (modelSizesRect && clientX >= modelSizesRect.left && clientX <= modelSizesRect.right && clientY >= modelSizesRect.top && clientY <= modelSizesRect.bottom) {
      targetSec = 'subsec-model-sizes';
    } else if (playbackRect && clientX >= playbackRect.left && clientX <= playbackRect.right && clientY >= playbackRect.top && clientY <= playbackRect.bottom) {
      targetSec = 'subsec-gcode-playback';
    } else if (gcodeTextureRect && clientX >= gcodeTextureRect.left && clientX <= gcodeTextureRect.right && clientY >= gcodeTextureRect.top && clientY <= gcodeTextureRect.bottom) {
      targetSec = 'subsec-gcode-texture';
    } else if (statsRect && clientX >= statsRect.left && clientX <= statsRect.right && clientY >= statsRect.top && clientY <= statsRect.bottom) {
      targetSec = 'subsec-gcode-stats';
    } else if (commandRect && clientX >= commandRect.left && clientX <= commandRect.right && clientY >= commandRect.top && clientY <= commandRect.bottom) {
      targetSec = 'subsec-gcode-command';
    } else if (descriptionRect && clientX >= descriptionRect.left && clientX <= descriptionRect.right && clientY >= descriptionRect.top && clientY <= descriptionRect.bottom) {
      targetSec = 'subsec-gcode-description';
    } else if (buildVol3dRect && clientX >= buildVol3dRect.left && clientX <= buildVol3dRect.right && clientY >= buildVol3dRect.top && clientY <= buildVol3dRect.bottom) {
      targetSec = 'subsec-3d-build-volume';
    } else if (model3dRect && clientX >= model3dRect.left && clientX <= model3dRect.right && clientY >= model3dRect.top && clientY <= model3dRect.bottom) {
      targetSec = 'subsec-3d-model';
    } else if (path3dRect && clientX >= path3dRect.left && clientX <= path3dRect.right && clientY >= path3dRect.top && clientY <= path3dRect.bottom) {
      targetSec = 'subsec-3d-path';
    } else if (base3dRect && clientX >= base3dRect.left && clientX <= base3dRect.right && clientY >= base3dRect.top && clientY <= base3dRect.bottom) {
      targetSec = 'subsec-3d-printer-base';
    } else if (coord3dRect && clientX >= coord3dRect.left && clientX <= coord3dRect.right && clientY >= coord3dRect.top && clientY <= coord3dRect.bottom) {
      targetSec = 'subsec-3d-coordinate-system';
    } else if (grid3dRect && clientX >= grid3dRect.left && clientX <= grid3dRect.right && clientY >= grid3dRect.top && clientY <= grid3dRect.bottom) {
      targetSec = 'subsec-3d-grid';
    } else if (modelInfoRect && clientX >= modelInfoRect.left && clientX <= modelInfoRect.right && clientY >= modelInfoRect.top && clientY <= modelInfoRect.bottom) {
      targetSec = 'subsec-3d-model-info';
    } else if (isOverView) {
      if (activeTab === 'model' && raycastHitTypeRef.current === 'model') {
        targetSec = 'subsec-3d-model';
      } else if (activeTab === 'gcode' && raycastHitTypeRef.current === 'gcode') {
        targetSec = 'subsec-3d-path';
      }
    } else if (isOverImportBtn) {
      targetSec = 'subsec-import';
    } else if (isOverLanguageBtn) {
      targetSec = 'subsec-language';
    } else if (isOverSmileyBtn) {
      targetSec = 'subsec-smiley';
    } else if (isOverStep3Tab) {
      targetSec = 'save';
    } else if (isOverStep1Tab || isOverDesignSection) {
      targetSec = 'design';
    } else if (isOverStep2Tab || isOverGcodeSection) {
      targetSec = 'gcode';
    } else if (isOverSettingsTab || isOverSettingsSection) {
      targetSec = 'settings';
    }

    // Handle dropped section docking and speech bubble triggering
    if (targetSec) {
      // Snap exactly into absolute position by removing relative mouse offset
      setOffset({ x: 0, y: 0 });
      offsetRef.current = { x: 0, y: 0 };

      // Clear flattening states on docking to deliver a speech
      setCollisionDir(null);
      setIsHighSpeedFlattened(false);
      setIsMediumSpeedFlattened(false);
      setFlattenedDir(null);

      // Open section controls
      if (targetSec === 'subsec-save-name') {
        const step1Btn = document.getElementById('step-1');
        if (step1Btn) step1Btn.click();
        setIsSidebarCollapsed(false);
        setMode('subsec_save_name_hover');
      } else if (targetSec === 'subsec-save-guide') {
        const step3Btn = document.getElementById('step-3');
        if (step3Btn) step3Btn.click();
        setIsSidebarCollapsed(false);
        setMode('subsec_save_guide_hover');
      } else if (targetSec === 'subsec-save-model-cup') {
        const step3Btn = document.getElementById('step-3');
        if (step3Btn) step3Btn.click();
        setIsSidebarCollapsed(false);
        setMode('subsec_save_model_cup_hover');
      } else if (targetSec === 'subsec-save-model-stl') {
        const step3Btn = document.getElementById('step-3');
        if (step3Btn) step3Btn.click();
        setIsSidebarCollapsed(false);
        setMode('subsec_save_model_stl_hover');
      } else if (targetSec === 'subsec-save-picture') {
        const step3Btn = document.getElementById('step-3');
        if (step3Btn) step3Btn.click();
        setIsSidebarCollapsed(false);
        setMode('subsec_save_picture_hover');
      } else if (targetSec === 'subsec-size') {
        setActiveTab?.('model');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_size_hover');
      } else if (targetSec === 'subsec-shape') {
        setActiveTab?.('model');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_shape_hover');
      } else if (targetSec === 'subsec-texture') {
        setActiveTab?.('model');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_texture_hover');
      } else if (targetSec === 'subsec-ribs') {
        setActiveTab?.('model');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_ribs_hover');
      } else if (targetSec === 'subsec-deformations') {
        setActiveTab?.('model');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_deformations_hover');
      } else if (targetSec === 'subsec-appearance') {
        setActiveTab?.('model');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_appearance_hover');
      } else if (targetSec === 'subsec-printer-settings') {
        setShowSettings?.(true);
        setIsSidebarCollapsed(false);
        setMode('subsec_settings_printer_hover');
      } else if (targetSec === 'subsec-model-sizes') {
        setShowSettings?.(true);
        setIsSidebarCollapsed(false);
        setMode('subsec_settings_sizes_hover');
      } else if (targetSec === 'subsec-gcode-playback') {
        setActiveTab?.('gcode');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_gcode_playback_hover');
      } else if (targetSec === 'subsec-gcode-texture') {
        setActiveTab?.('gcode');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_gcode_texture_hover');
        setTimeout(() => {
          document.getElementById('subsec-gcode-texture-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      } else if (targetSec === 'subsec-gcode-stats') {
        setActiveTab?.('gcode');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_gcode_stats_hover');
      } else if (targetSec === 'subsec-gcode-command') {
        setActiveTab?.('gcode');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_gcode_command_hover');
      } else if (targetSec === 'subsec-gcode-description') {
        setActiveTab?.('gcode');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('subsec_gcode_description_hover');
      } else if (targetSec === 'subsec-3d-build-volume') {
        setMode('subsec_3d_build_volume_hover');
      } else if (targetSec === 'subsec-3d-model') {
        setMode('subsec_3d_model_hover');
      } else if (targetSec === 'subsec-3d-path') {
        setActiveTab?.('gcode');
        setMode('subsec_3d_path_hover');
      } else if (targetSec === 'subsec-3d-printer-base') {
        setMode('subsec_3d_printer_base_hover');
      } else if (targetSec === 'subsec-3d-coordinate-system') {
        setMode('subsec_3d_coordinate_system_hover');
      } else if (targetSec === 'subsec-3d-grid') {
        setMode('subsec_3d_grid_hover');
      } else if (targetSec === 'subsec-3d-view-control') {
        setMode('subsec_3d_view_control_hover');
      } else if (targetSec === 'subsec-3d-model-info') {
        setMode('subsec_3d_model_info_hover');
      } else if (targetSec === 'subsec-import') {
        setMode('subsec_import_hover');
      } else if (targetSec === 'subsec-language') {
        setMode('subsec_language_hover');
      } else if (targetSec === 'subsec-smiley') {
        setMode('subsec_smiley_hover');
      } else if (targetSec === 'design') {
        setActiveTab?.('model');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('design_hover');
      } else if (targetSec === 'gcode') {
        setActiveTab?.('gcode');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('gcode_hover');
      } else if (targetSec === 'save') {
        setActiveTab?.('save');
        setShowSettings?.(false);
        setIsSidebarCollapsed(false);
        setMode('save_hover');
      } else if (targetSec === 'settings') {
        setShowSettings?.(true);
        setIsSidebarCollapsed(false);
        setMode('settings_hover');
      }

      setIndex(0);
      setIsBubbleVisible(true);
      if (setHighlightedSection) {
        setHighlightedSection(targetSec);
      }
    } else {
      if (setHighlightedSection) {
        setHighlightedSection(null);
      }
      setMode('idle');
      setIsBubbleVisible(false);
    }
    setIsOverViewWindow(false);
    window.dispatchEvent(new CustomEvent('smiley-over-view-window', { detail: { isOver: false } }));
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    releaseOffsetRef.current = { ...offsetRef.current };
    setIsDraggingState(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDraggingRef.current = false;

    setOffset({ x: 0, y: 0 });
    offsetRef.current = { x: 0, y: 0 };
    setMode('idle');
    setIsBubbleVisible(false);

    if (setHighlightedSection) {
      setHighlightedSection(null);
    }
    setIsOverViewWindow(false);
    window.dispatchEvent(new CustomEvent('smiley-over-view-window', { detail: { isOver: false } }));
  };

  // Sync settings triggers of parent component with guide triggers 
  useEffect(() => {
    if (!showSettings) {
      if (mode === 'settings_hover') {
        setMode('idle');
        setIsBubbleVisible(false);
        setIndex(0);
      }
    }
  }, [showSettings]);

  // Reset dialogue on tab shifts - restricting Design and Calculate actions
  useEffect(() => {
    if (activeTab === 'gcode' && mode === 'design_hover') {
      setMode('idle');
      setIsBubbleVisible(false);
      setIndex(0);
    } else if (activeTab === 'model' && (mode === 'gcode_hover' || mode === 'save_hover')) {
      setMode('idle');
      setIsBubbleVisible(false);
      setIndex(0);
    }
  }, [activeTab]);

  // Organic random blink loop
  useEffect(() => {
    if (!setHighlightedSection) return;
    
    if (isBubbleVisible && mode !== 'idle' && mode !== 'starting') {
      let activeSectionId: string | null = null;
      if (mode === 'subsec_save_name_hover') activeSectionId = 'subsec-save-name';
      else if (mode === 'subsec_save_guide_hover') activeSectionId = 'subsec-save-guide';
      else if (mode === 'subsec_save_model_cup_hover') activeSectionId = 'subsec-save-model-cup';
      else if (mode === 'subsec_save_model_stl_hover') activeSectionId = 'subsec-save-model-stl';
      else if (mode === 'subsec_save_picture_hover') activeSectionId = 'subsec-save-picture';
      else if (mode === 'subsec_size_hover') activeSectionId = 'subsec-size';
      else if (mode === 'subsec_shape_hover') activeSectionId = 'subsec-shape';
      else if (mode === 'subsec_texture_hover') activeSectionId = 'subsec-texture';
      else if (mode === 'subsec_ribs_hover') activeSectionId = 'subsec-ribs';
      else if (mode === 'subsec_deformations_hover') activeSectionId = 'subsec-deformations';
      else if (mode === 'subsec_appearance_hover') activeSectionId = 'subsec-appearance';
      else if (mode === 'subsec_settings_printer_hover') activeSectionId = 'subsec-printer-settings';
      else if (mode === 'subsec_settings_sizes_hover') activeSectionId = 'subsec-model-sizes';
      else if (mode === 'subsec_gcode_playback_hover') activeSectionId = 'subsec-gcode-playback';
      else if (mode === 'subsec_gcode_texture_hover') activeSectionId = 'subsec-gcode-texture';
      else if (mode === 'subsec_gcode_stats_hover') activeSectionId = 'subsec-gcode-stats';
      else if (mode === 'subsec_gcode_command_hover') activeSectionId = 'subsec-gcode-command';
      else if (mode === 'subsec_gcode_description_hover') activeSectionId = 'subsec-gcode-description';
      else if (mode === 'subsec_3d_build_volume_hover') activeSectionId = 'subsec-3d-build-volume';
      else if (mode === 'subsec_3d_model_hover') activeSectionId = 'subsec-3d-model';
      else if (mode === 'subsec_3d_path_hover') activeSectionId = 'subsec-3d-path';
      else if (mode === 'subsec_3d_printer_base_hover') activeSectionId = 'subsec-3d-printer-base';
      else if (mode === 'subsec_3d_coordinate_system_hover') activeSectionId = 'subsec-3d-coordinate-system';
      else if (mode === 'subsec_3d_view_control_hover') activeSectionId = 'subsec-3d-view-control';
      else if (mode === 'subsec_3d_model_info_hover') activeSectionId = 'subsec-3d-model-info';
      else if (mode === 'design_hover') activeSectionId = 'design';
      else if (mode === 'gcode_hover') activeSectionId = 'gcode';
      else if (mode === 'save_hover') activeSectionId = 'save';
      else if (mode === 'settings_hover') activeSectionId = 'settings';

      if (activeSectionId) {
        setHighlightedSection(activeSectionId);
      }
    } else {
      if (!isDraggingRef.current) {
        setHighlightedSection(null);
      }
    }
  }, [mode, isBubbleVisible, setHighlightedSection]);

  // Organic random blink loop
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    let openTimer: NodeJS.Timeout;

    const triggerBlink = () => {
      if (isSleeping) {
        blinkTimer = setTimeout(triggerBlink, 2000);
        return;
      }
      setIsBlinking(true);
      openTimer = setTimeout(() => {
        setIsBlinking(false);
        const nextTime = 2500 + Math.random() * 4500;
        blinkTimer = setTimeout(triggerBlink, nextTime);
      }, 160);
    };

    blinkTimer = setTimeout(triggerBlink, 3000);

    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(openTimer);
    };
  }, [isSleeping]);

  const currentMessages = useMemo(() => {
    let rawList: SmileyMessage[] = [];
    if (mode === 'starting') rawList = messagesMap.starting || [];
    else if (mode === 'design_hover') rawList = messagesMap.design_hover || [];
    else if (mode === 'gcode_hover') rawList = messagesMap.gcode_hover || [];
    else if (mode === 'settings_hover') rawList = messagesMap.settings_hover || [];
    else if ((messagesMap as any)[mode]) rawList = (messagesMap as any)[mode] || [];
    
    return rawList.map((item, idx) => {
      if (mode === 'starting') {
        if (idx === 0) {
          return {
            ...item,
            text: "Croeso, rwy'n gynorthwyydd argraffu 3D i chi, dewiswch eich iaith\n\nWelcome, I'm your 3D printing assistant, select your language"
          };
        }
        return {
          ...item,
          text: language === 'cy' ? (item.textCy || item.text) : item.text
        };
      } else {
        return {
          ...item,
          text: language === 'cy' ? (item.textCy || item.text) : item.text
        };
      }
    });
  }, [mode, messagesMap, language]);

  const arrowConfig = useMemo(() => {
    if (!isBubbleVisible || mode === 'idle') return null;

    // Hide pointing arrow when docked in any sidebar section
    const isSidebarSubSection = mode.startsWith('subsec_') || mode === 'settings_hover';
    if (isSidebarSubSection && !isSidebarCollapsed) return null;

    const currentMsg = currentMessages[index];
    if (!currentMsg || !currentMsg.arrowNeeded) return null;

    const rawDir = currentMsg.arrowDirection;
    const direction = normalizeDirection(rawDir);
    const style = getArrowStyleConfig(direction);

    return {
      style,
      direction
    };
  }, [index, mode, isBubbleVisible, currentMessages]);

  const arrowDirection = arrowConfig?.direction;

  const faceLayout = useMemo(() => {
    return getFaceLayout(collisionDir, isHighSpeedFlattened, flattenedDir, isMediumSpeedFlattened);
  }, [collisionDir, isHighSpeedFlattened, flattenedDir, isMediumSpeedFlattened]);

  const morphedPath = useMemo(() => {
    if (!morphedShape && !morphedDeform) return null;

    try {
      const baseParams = params || DEFAULT_MODEL_PARAMS;
      const activeParams = {
        ...baseParams,
        // If cornerRadius is current, apply it, else default to 0 to not compound!
        cornerRadius: (morphedDeformField === 'cornerRadius' && morphedDeform) ? morphedDeform.cornerRadius : 0,
      };
      let pts: { x: number; y: number }[] = [];

      // Always base the points on the active model's shape (polygon, star, flower, gear)
      // to ensure deformations (like twist, bulge, cornerRadius) map correctly to the true shape.
      pts = getRoundedPolygonPoints(activeParams, 44);

      if (!pts || pts.length === 0) return null;

      // Apply 3D-projected deformation coordinates if morphedDeform is active
      const activeDeform = morphedDeform;
      const demappedPoints = pts.map(p => {
        let px = p.x;
        let py = p.y;

        if (activeDeform) {
          const R = 44;
          const zFrac = (py + R) / (2 * R); // Normalized Z equivalent: 0 (top) to 1 (bottom)

          // 1. Bulge deformation
          if (morphedDeformField === 'bulge' && activeDeform.bulge !== 0) {
            const bulgeVal = activeDeform.bulge / 25; // standard clay radius is 25
            const bulgeSplit = activeDeform.bulgeSplitPoint ?? 0.5;
            const d = zFrac - bulgeSplit;
            const factor = Math.max(0, 1.0 - 4.0 * d * d);
            const scale = 1.0 + bulgeVal * factor;
            px *= scale;
            py *= scale;

            // Normalize scale so that large bulging doesn't exceed the SVG viewBox and cut off
            const fitFactor = 1.0 / (1.0 + Math.abs(bulgeVal) * 0.45);
            px *= fitFactor;
            py *= fitFactor;
          }

          // 2. Taper (draftAngle) deformation
          if (morphedDeformField === 'draftAngle' && activeDeform.draftAngle !== 0) {
            const taperAmount = Math.tan((activeDeform.draftAngle) * Math.PI / 180) * 1.2;
            const taperSplit = activeDeform.taperSplitPoint ?? 0.5;
            const scale = 1.0 - (zFrac - taperSplit) * taperAmount;
            px *= scale;
          }

          // 3. Twist (rotation) deformation
          if (morphedDeformField === 'rotation' && activeDeform.rotation !== 0) {
            const twistAngle = (activeDeform.rotation * Math.PI / 180) * 0.45;
            const twistSplit = activeDeform.twistSplitPoint ?? 0.5;
            const theta = (zFrac - twistSplit) * twistAngle;
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);
            const rx = px * cosT - py * sinT;
            const ry = px * sinT + py * cosT;
            px = rx;
            py = ry;
          }
        }

        return { x: px, y: py };
      });

      const isHigh = isHighSpeedFlattened && flattenedDir;
      const isMed = isMediumSpeedFlattened && flattenedDir;
      const activeDir = (isHigh || isMed) ? flattenedDir : collisionDir;
      const flatDepth = isHigh ? 17 : (isMed ? 7 : (collisionDir ? 7 : 0));
      const f = 44 - flatDepth;

      const mappedPoints = demappedPoints.map(p => {
        let x = p.x;
        let y = p.y;

        if (activeDir) {
          if (activeDir === 'left' && x < -f) {
            x = -f;
          } else if (activeDir === 'right' && x > f) {
            x = f;
          } else if (activeDir === 'top' && y < -f) {
            y = -f;
          } else if (activeDir === 'bottom' && y > f) {
            y = f;
          }
        }

        return { x: 50 + x, y: 50 + y };
      });

      const p0 = mappedPoints[0];
      let d = `M ${p0.x.toFixed(3)} ${p0.y.toFixed(3)}`;
      for (let i = 1; i < mappedPoints.length; i++) {
        d += ` L ${mappedPoints[i].x.toFixed(3)} ${mappedPoints[i].y.toFixed(3)}`;
      }
      d += ' Z';
      return d;
    } catch (e) {
      console.error("Error generating morphed path for smiley:", e);
      return null;
    }
  }, [morphedShape, morphedDeform, morphedDeformField, params, collisionDir, isHighSpeedFlattened, isMediumSpeedFlattened, flattenedDir]);

  const isHigh = isHighSpeedFlattened && flattenedDir;
  const isMed = isMediumSpeedFlattened && flattenedDir;
  const activeDir = (isHigh || isMed) ? flattenedDir : collisionDir;
  const flatDepth = isHigh ? 17 : (isMed ? 7 : (collisionDir ? 7 : 0));
  const f = 44 - flatDepth; // distance from center to flat line

  // Helper to clamp a coordinate ellipse inside the circular or flattened face boundary
  const clampPoint = (x: number, y: number, rx: number, ry: number) => {
    const strokeWidth = mode === 'starting' ? 2.625 : 4.2;
    const margin = 2.5;
    const maxR_x = 44 - strokeWidth - rx - margin;
    const maxR_y = 44 - strokeWidth - ry - margin;

    let dx = x - 50;
    let dy = y - 50;

    // Normalize against ellipse boundary
    const nx = dx / maxR_x;
    const ny = dy / maxR_y;
    const normDist = Math.hypot(nx, ny);
    if (normDist > 1.0 && normDist > 0) {
      dx = (nx / normDist) * maxR_x;
      dy = (ny / normDist) * maxR_y;
    }
    let clampedX = 50 + dx;
    let clampedY = 50 + dy;

    if (activeDir) {
      const flatX = 50 - f + strokeWidth + rx + margin; // for left flat
      const flatXRight = 50 + f - strokeWidth - rx - margin; // for right flat
      const flatYTop = 50 - f + strokeWidth + ry + margin; // for top flat
      const flatYBottom = 50 + f - strokeWidth - ry - margin; // for bottom flat

      if (activeDir === 'left' && clampedX < flatX) {
        clampedX = flatX;
      } else if (activeDir === 'right' && clampedX > flatXRight) {
        clampedX = flatXRight;
      } else if (activeDir === 'top' && clampedY < flatYTop) {
        clampedY = flatYTop;
      } else if (activeDir === 'bottom' && clampedY > flatYBottom) {
        clampedY = flatYBottom;
      }
    }

    return { x: clampedX, y: clampedY };
  };

  const clampMouthOffset = (offsetX: number, offsetY: number) => {
    const strokeWidth = mode === 'starting' ? 2.625 : 4.2;
    const margin = 2.5;
    const innerR = 44 - strokeWidth - margin;

    // Define mouth dimensions relative to center (50, 68)
    let rx = 22;
    let ry_up = 6;
    let ry_down = 14;

    if (isYawning) {
      rx = 11;
      ry_up = 17;
      ry_down = 17;
    } else if (isSleeping) {
      rx = 8;
      ry_up = 8;
      ry_down = 8;
    } else if (isInflating) {
      rx = 10;
      ry_up = 10;
      ry_down = 10;
    } else if (collisionDir) {
      rx = 22;
      ry_up = 0;
      ry_down = 0;
    }

    // 1. Clamp mouth center Y (my)
    let my = 68 + offsetY;

    let minY = 50 - innerR + ry_up + margin;
    let maxY = 50 + innerR - ry_down - margin;

    // Additionally handle flat wall top/bottom constraints if activeDir is set
    if (activeDir) {
      if (activeDir === 'top') {
        const limitY = 50 - f + strokeWidth + ry_up + margin;
        if (minY < limitY) minY = limitY;
      } else if (activeDir === 'bottom') {
        const limitY = 50 + f - strokeWidth - ry_down - margin;
        if (maxY > limitY) maxY = limitY;
      }
    }

    my = Math.max(minY, Math.min(maxY, my));
    const clampedOffsetY = my - 68;

    // 2. Clamp mouth center X (mx) at this clamped my
    // Take the minimum horizontal circle width across the y-span [my - ry_up, my + ry_down]
    const dy1 = (my - ry_up) - 50;
    const dy2 = my - 50;
    const dy3 = (my + ry_down) - 50;

    const w1 = Math.sqrt(Math.max(0, innerR * innerR - dy1 * dy1));
    const w2 = Math.sqrt(Math.max(0, innerR * innerR - dy2 * dy2));
    const w3 = Math.sqrt(Math.max(0, innerR * innerR - dy3 * dy3));

    const R_inner_at_Y = Math.min(w1, w2, w3);

    let minMx = 50 - R_inner_at_Y + rx + margin;
    let maxMx = 50 + R_inner_at_Y - rx - margin;

    // Adjust for activeDir flat wall vertical boundary constraints
    if (activeDir) {
      if (activeDir === 'left') {
        const limitX = 50 - f + strokeWidth + rx + margin;
        if (minMx < limitX) minMx = limitX;
      } else if (activeDir === 'right') {
        const limitX = 50 + f - strokeWidth - rx - margin;
        if (maxMx > limitX) maxMx = limitX;
      }
    }

    // Safety fallback
    if (minMx > maxMx) {
      const mid = (minMx + maxMx) / 2;
      minMx = mid;
      maxMx = mid;
    }

    let mx = 50 + offsetX;
    mx = Math.max(minMx, Math.min(maxMx, mx));
    const clampedOffsetX = mx - 50;

    return { x: clampedOffsetX, y: clampedOffsetY };
  };

  const clampEyeGroupOffset = (offsetX: number, offsetY: number) => {
    const strokeWidth = mode === 'starting' ? 2.625 : 4.2;
    const margin = 2.5;

    // First clamp offsetY
    // The vertical span of the eyes is roughly y in [34, 48] (center 41, half-height 7.0 + margin 2.5 = 9.5)
    const innerR = 44 - strokeWidth - margin;
    const minY = 50 - innerR + 9.5;
    const maxY = 50 + innerR - 9.5;
    
    let Y = 41 + offsetY;
    Y = Math.max(minY, Math.min(maxY, Y));
    
    if (activeDir) {
      if (activeDir === 'top') {
        const limitY = 50 - f + strokeWidth + 9.5;
        if (Y < limitY) Y = limitY;
      } else if (activeDir === 'bottom') {
        const limitY = 50 + f - strokeWidth - 9.5;
        if (Y > limitY) Y = limitY;
      }
    }

    const clampedOffsetY = Y - 41;

    // Now clamp offsetX at this Y
    // Calculate the horizontal width of the circle at this Y
    const dy = Y - 50;
    const R_inner_at_Y = Math.sqrt(Math.max(0, innerR * innerR - dy * dy));

    // Combined safe horizontal range of tx:
    // tx must be >= 24.5 - R_inner_at_Y
    // tx must be <= -24.5 + R_inner_at_Y
    let minTx = 24.5 - R_inner_at_Y;
    let maxTx = -24.5 + R_inner_at_Y;

    // Adjust for activeDir flat wall vertical boundary constraints
    if (activeDir) {
      if (activeDir === 'left') {
        const limitTx = 24.5 - f + strokeWidth;
        if (minTx < limitTx) minTx = limitTx;
      } else if (activeDir === 'right') {
        const limitTx = -24.5 + f - strokeWidth;
        if (maxTx > limitTx) maxTx = limitTx;
      }
    }

    // Safety check if minTx > maxTx (due to squishing)
    if (minTx > maxTx) {
      const mid = (minTx + maxTx) / 2;
      minTx = mid;
      maxTx = mid;
    }

    const clampedOffsetX = Math.max(minTx, Math.min(maxTx, offsetX));

    return { x: clampedOffsetX, y: clampedOffsetY };
  };

  const rawMouthOffset = {
    x: (isGiddy ? (giddyLeftOffset.x + giddyRightOffset.x) / 2 : eyeOffset.x) * 0.45 + faceLayout.featureOffset.x,
    y: (isGiddy ? (giddyLeftOffset.y + giddyRightOffset.y) / 2 : eyeOffset.y) * 0.45 + faceLayout.featureOffset.y,
  };
  const mouthOffset = clampMouthOffset(rawMouthOffset.x, rawMouthOffset.y);

  const desiredLeftEyeX = 36 + (isGiddy ? giddyLeftOffset.x : eyeOffset.x) + faceLayout.featureOffset.x;
  const desiredLeftEyeY = 41 + (isGiddy ? giddyLeftOffset.y : eyeOffset.y) + faceLayout.featureOffset.y;
  const clampedLeftEye = clampPoint(desiredLeftEyeX, desiredLeftEyeY, 6.5, 11);

  const desiredRightEyeX = 64 + (isGiddy ? giddyRightOffset.x : eyeOffset.x) + faceLayout.featureOffset.x;
  const desiredRightEyeY = 41 + (isGiddy ? giddyRightOffset.y : eyeOffset.y) + faceLayout.featureOffset.y;
  const clampedRightEye = clampPoint(desiredRightEyeX, desiredRightEyeY, 6.5, 11);

  const rawEyeGroupOffset = {
    x: isGiddy ? giddyLeftOffset.x + faceLayout.featureOffset.x : eyeOffset.x + faceLayout.featureOffset.x,
    y: isGiddy ? giddyLeftOffset.y + faceLayout.featureOffset.y : eyeOffset.y + faceLayout.featureOffset.y,
  };
  const eyeGroupOffset = clampEyeGroupOffset(rawEyeGroupOffset.x, rawEyeGroupOffset.y);

  const activeDeform = morphedDeform;
  const activeRotation = (morphedDeformField === 'rotation' && activeDeform) ? activeDeform.rotation : 0;
  const activeCornerRadius = (morphedDeformField === 'cornerRadius' && activeDeform) ? activeDeform.cornerRadius : 0;

  // Let the eyes get rounder and moderately larger based on corner radius, without overlapping
  const roundnessFrac = activeCornerRadius > 0 ? Math.min(1.0, activeCornerRadius / 3.0) : 0;
  const baseSizeScale = 1.0 + 0.12 * roundnessFrac; // eyes get up to 12% larger in layout scale
  const activeRx = (6.5 + 2.5 * roundnessFrac) * baseSizeScale; // rx goes from 6.5 -> 9.0, then scaled (+12%)
  const activeRy = (11.0 - 1.0 * roundnessFrac) * baseSizeScale; // ry goes from 11.0 -> 10.0, then scaled (+12%)

  const squashStyle: React.CSSProperties = {
    transition: 'transform 0.12s ease-out, transform-origin 0.12s ease-out',
    transformOrigin: 'center',
    overflow: 'visible',
  };

  if (isInflating) {
    // Inflating/puffing up to 1.25 times larger before popping back to normal
    squashStyle.transform = 'scale(1.25)';
    squashStyle.transformOrigin = 'center';
  } else {
    // Elastic deformation is handled directly via custom SVG path to prevent ovoid distortion!
    squashStyle.transform = 'scale(1)';
    squashStyle.transformOrigin = 'center';
  }

  // Clean up collision timer on unmount
  useEffect(() => {
    return () => {
      if (collisionTimeoutRef.current) {
        clearTimeout(collisionTimeoutRef.current);
      }
      if (restTimerRef.current) {
        clearTimeout(restTimerRef.current);
      }
      if (inflationTimeoutRef.current) {
        clearTimeout(inflationTimeoutRef.current);
      }
      if (sadStarsTimeoutRef.current) {
        clearTimeout(sadStarsTimeoutRef.current);
      }
    };
  }, []);

  // Track activities, Sleep timers, and cursor motion detectors
  useEffect(() => {
    const handleActivity = (e: MouseEvent) => {
      const now = Date.now();
      lastActivityRef.current = now;
      setIsSleeping(false);

      if (isGiddy) return;

      const currentX = e.clientX;
      const lastX = lastMouseXRef.current;
      lastMouseXRef.current = currentX;

      if (lastX === null) return;

      const dx = currentX - lastX;
      if (Math.abs(dx) > 18) {
        const direction = dx > 0 ? 'right' : 'left';
        if (currentDirectionRef.current && currentDirectionRef.current !== direction) {
          const timeSinceSwap = now - lastDirectionChangeRef.current;
          if (timeSinceSwap < 600) {
            directionSwapsRef.current += 1;
            if (directionSwapsRef.current >= 6) {
              setIsGiddy(true);
              directionSwapsRef.current = 0;
              setTimeout(() => {
                setIsGiddy(false);
              }, 2800);
            }
          } else {
            directionSwapsRef.current = 1;
          }
          lastDirectionChangeRef.current = now;
        }
        currentDirectionRef.current = direction;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const now = Date.now();
      lastActivityRef.current = now;
      setIsSleeping(false);

      if (isGiddy) return;

      const currentX = e.touches[0].clientX;
      const lastX = lastMouseXRef.current;
      lastMouseXRef.current = currentX;

      if (lastX === null) return;

      const dx = currentX - lastX;
      if (Math.abs(dx) > 12) {
        const direction = dx > 0 ? 'right' : 'left';
        if (currentDirectionRef.current && currentDirectionRef.current !== direction) {
          const timeSinceSwap = now - lastDirectionChangeRef.current;
          if (timeSinceSwap < 600) {
            directionSwapsRef.current += 1;
            if (directionSwapsRef.current >= 6) {
              setIsGiddy(true);
              directionSwapsRef.current = 0;
              setTimeout(() => {
                setIsGiddy(false);
              }, 2800);
            }
          } else {
            directionSwapsRef.current = 1;
          }
          lastDirectionChangeRef.current = now;
        }
        currentDirectionRef.current = direction;
      }
    };

    const handleOtherActivity = () => {
      lastActivityRef.current = Date.now();
      setIsSleeping(false);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mousedown', handleOtherActivity);
    window.addEventListener('keydown', handleOtherActivity);
    window.addEventListener('wheel', handleOtherActivity);
    window.addEventListener('touchstart', handleOtherActivity);

    const interval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityRef.current;
      if (inactiveMs >= 60000) {
        setIsSleeping(true);
        setIsYawning(false);
      } else if (inactiveMs >= 57500) {
        if (!isSleeping) {
          setIsYawning(true);
        }
      } else {
        if (!wakeUpYawnTimeoutRef.current) {
          setIsYawning(false);
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handleOtherActivity);
      window.removeEventListener('keydown', handleOtherActivity);
      window.removeEventListener('wheel', handleOtherActivity);
      window.removeEventListener('touchstart', handleOtherActivity);
      clearInterval(interval);
    };
  }, [isGiddy]);

  // Handle wake up yawn transition
  useEffect(() => {
    if (prevSleepingRef.current && !isSleeping) {
      setIsYawning(true);
      if (wakeUpYawnTimeoutRef.current) {
        clearTimeout(wakeUpYawnTimeoutRef.current);
      }
      wakeUpYawnTimeoutRef.current = setTimeout(() => {
        setIsYawning(false);
        wakeUpYawnTimeoutRef.current = null;
      }, 1200);
    }
    prevSleepingRef.current = isSleeping;
  }, [isSleeping]);

  useEffect(() => {
    return () => {
      if (wakeUpYawnTimeoutRef.current) {
        clearTimeout(wakeUpYawnTimeoutRef.current);
      }
    };
  }, []);

  // Giddy animation ticks
  useEffect(() => {
    if (!isGiddy) return;

    let frameId: number;
    const startTime = Date.now();

    const tick = () => {
      const time = (Date.now() - startTime) * 0.035;

      setGiddyLeftOffset({
        x: Math.cos(time * 1.6) * 4.5,
        y: Math.sin(time * 2.3) * 4.5
      });
      setGiddyRightOffset({
        x: Math.sin(time * 1.9 + 1.1) * 4.5,
        y: Math.cos(time * 1.4) * 4.5
      });

      frameId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frameId);
  }, [isGiddy]);

  // Handle eyes focus direction
  useEffect(() => {
    if (isSleeping) {
      setEyeOffset({ x: 0, y: 0 });
      return;
    }
    if (isBubbleVisible && arrowDirection) {
      switch (arrowDirection) {
        case 'up': setEyeOffset({ x: 0, y: -3.5 }); break;
        case 'down': setEyeOffset({ x: 0, y: 3.5 }); break;
        case 'left': setEyeOffset({ x: -3.5, y: 0 }); break;
        case 'right': setEyeOffset({ x: 3.5, y: 0 }); break;
        default: setEyeOffset({ x: 0, y: 0 });
      }
      return;
    }

    const handleMouseMoveEyes = (e: MouseEvent) => {
      if (!smileyRef.current || isGiddy) return;
      const rect = smileyRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist === 0) {
        setEyeOffset({ x: 0, y: 0 });
      } else {
        const angle = Math.atan2(dy, dx);
        const maxDist = 3.5;
        const actualDist = Math.min(maxDist, dist / 45);
        setEyeOffset({
          x: Math.cos(angle) * actualDist,
          y: Math.sin(angle) * actualDist
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMoveEyes);
    return () => window.removeEventListener('mousemove', handleMouseMoveEyes);
  }, [isBubbleVisible, arrowDirection, isSleeping, isGiddy]);

  // Play starting dialogue on mount
  useEffect(() => {
    setMode('starting');
    setIndex(0);
    setIsBubbleVisible(true);
  }, []);



  // Typewriter effect
  useEffect(() => {
    const fullText = currentMessages[index]?.text || '';
    if (!isBubbleVisible || !fullText) {
      setTypedText('');
      return;
    }

    setTypedText('');
    let currentIdx = 0;
    const intervalTime = 16; // slightly accelerated for dual language readability
    
    const interval = setInterval(() => {
      currentIdx++;
      setTypedText(fullText.slice(0, currentIdx));
      if (currentIdx >= fullText.length) {
        clearInterval(interval);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [index, mode, isBubbleVisible, currentMessages]);

  const handleSmileyClick = () => {
    if (isDraggingRef.current) return;
    if (mode === 'starting') {
      if (index < currentMessages.length - 1) {
        setIndex(index + 1);
      } else {
        setMode('idle');
        setIsBubbleVisible(false);
        setIndex(0);
      }
      return;
    }
    
    if (mode === 'idle') {
      if (isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
        setTimeout(() => {
          if (showSettings) {
            setMode('settings_hover');
          } else if (activeTab === 'model') {
            setMode('design_hover');
          } else if (activeTab === 'gcode') {
            setMode('gcode_hover');
          }
          setIndex(0);
          setIsBubbleVisible(true);
        }, 300);
      } else {
        if (showSettings) {
          setMode('settings_hover');
        } else if (activeTab === 'model') {
          setMode('design_hover');
        } else if (activeTab === 'gcode') {
          setMode('gcode_hover');
        }
        setIndex(0);
        setIsBubbleVisible(true);
      }
    } else {
      setMode('idle');
      setIndex(0);
      setIsBubbleVisible(false);
    }
  };

  const getCoordinates = () => {
    const restingLeft = isSidebarCollapsed ? '16px' : '356px';
    const restingTop = '80px'; // standard top resting position

    if (mode === 'idle') {
      return { left: restingLeft, top: restingTop };
    }

    let targetElementId = '';
    
    // Step Tabs & Buttons
    if (mode === 'design_hover') targetElementId = isSidebarCollapsed ? 'step-1' : 'design-section-container';
    else if (mode === 'gcode_hover') targetElementId = isSidebarCollapsed ? 'step-2' : 'gcode-section-container';
    else if (mode === 'save_hover') targetElementId = isSidebarCollapsed ? 'step-3' : 'save-section-container';
    else if (mode === 'settings_hover') targetElementId = isSidebarCollapsed ? 'settings-button' : 'settings-section-container';
    // 3D HUD & view controls (fallback to outer components if expanded items are not present)
    else if (mode === 'subsec_3d_build_volume_hover') targetElementId = document.getElementById('subsec-view-item-buildvolume') ? 'subsec-view-item-buildvolume' : 'subsec-3d-build-volume-container';
    else if (mode === 'subsec_3d_model_hover') targetElementId = 'subsec-3d-model-container';
    else if (mode === 'subsec_3d_path_hover') targetElementId = 'subsec-3d-path-container';
    else if (mode === 'subsec_3d_printer_base_hover') targetElementId = document.getElementById('subsec-view-item-baseplate') ? 'subsec-view-item-baseplate' : 'subsec-3d-printer-base-container';
    else if (mode === 'subsec_3d_coordinate_system_hover') targetElementId = document.getElementById('subsec-view-item-axis') ? 'subsec-view-item-axis' : 'subsec-3d-coordinate-system-container';
    else if (mode === 'subsec_3d_grid_hover') targetElementId = document.getElementById('subsec-view-item-grid') ? 'subsec-view-item-grid' : 'subsec-3d-grid-container';
    else if (mode === 'subsec_3d_view_control_hover') targetElementId = document.getElementById('subsec-view-item-views') ? 'subsec-view-item-views' : 'subsec-view-control-container';
    else if (mode === 'subsec_3d_model_info_hover') targetElementId = 'subsec-model-info-container';
    // Sidebar Target subsections
    else if (mode === 'subsec_save_name_hover') targetElementId = 'subsec-save-name-container';
    else if (mode === 'subsec_save_guide_hover') targetElementId = 'subsec-save-guide-container';
    else if (mode === 'subsec_save_model_cup_hover') targetElementId = 'subsec-save-model-cup-container';
    else if (mode === 'subsec_save_model_stl_hover') targetElementId = 'subsec-save-model-stl-container';
    else if (mode === 'subsec_save_picture_hover') targetElementId = 'subsec-save-picture-container';
    else if (mode === 'subsec_size_hover') targetElementId = 'subsec-size-container';
    else if (mode === 'subsec_shape_hover') targetElementId = 'subsec-shape-container';
    else if (mode === 'subsec_texture_hover') targetElementId = 'subsec-texture-container';
    else if (mode === 'subsec_ribs_hover') targetElementId = 'subsec-rib-container';
    else if (mode === 'subsec_deformations_hover') targetElementId = 'subsec-deformations-container';
    else if (mode === 'subsec_appearance_hover') targetElementId = 'subsec-appearance-container';
    else if (mode === 'subsec_settings_printer_hover') targetElementId = 'subsec-printer-settings-container';
    else if (mode === 'subsec_settings_sizes_hover') targetElementId = 'subsec-model-sizes-container';
    else if (mode === 'subsec_gcode_playback_hover') targetElementId = 'gcode-player-tour-target';
    else if (mode === 'subsec_gcode_texture_hover') targetElementId = 'subsec-gcode-texture-container';
    else if (mode === 'subsec_gcode_stats_hover') targetElementId = 'subsec-playback-stats-container';
    else if (mode === 'subsec_gcode_command_hover') targetElementId = 'subsec-gcode-command-container';
    else if (mode === 'subsec_gcode_description_hover') targetElementId = 'subsec-gcode-description-container';
    else if (mode === 'subsec_import_hover') targetElementId = 'import-container';
    else if (mode === 'subsec_language_hover') targetElementId = 'language-toggle-container';
    else if (mode === 'subsec_smiley_hover') targetElementId = 'smiley-toggle-container';

    if (targetElementId) {
      const el = document.getElementById(targetElementId);
      if (el) {
        const rect = el.getBoundingClientRect();
        const isRightHalf = rect.left > window.innerWidth / 2;
        const isFromViewControl = targetElementId.startsWith('subsec-view-item-');
        const isMenuSection = targetElementId.endsWith('-section-container');
        
        const isTopBarButton = targetElementId === 'import-container' || targetElementId === 'language-toggle-container' || targetElementId === 'smiley-toggle-container';
        
        // Compute the precise non-bouncing snapped corner coordinates:
        // Lock to Top-Left if on the right half of the screen, or Top-Right if on the left half!
        // For view-control buttons, always move to their left and shift vertical alignment slightly
        let posX = isMenuSection
          ? rect.right - 44
          : (isFromViewControl 
              ? rect.left - 110 
              : (isTopBarButton
                  ? rect.left + rect.width / 2 - 48
                  : (isRightHalf ? rect.left - 48 : rect.right - 48)));
        let posY = isMenuSection
          ? rect.top + 10
          : (isFromViewControl 
              ? rect.top - 20 
              : (isTopBarButton
                  ? rect.bottom + 8
                  : rect.top - 48));

        // Explicitly dock to top left of view control and model info boxes
        if (
          targetElementId === 'subsec-view-control-container' || 
          targetElementId === 'subsec-model-info-container' ||
          targetElementId === 'subsec-view-item-views' ||
          targetElementId === 'subsec-view-item-grid' ||
          targetElementId === 'subsec-view-item-baseplate' ||
          targetElementId === 'subsec-view-item-axis' ||
          targetElementId === 'subsec-view-item-buildvolume' ||
          mode === 'subsec_3d_view_control_hover' ||
          mode === 'subsec_3d_model_info_hover' ||
          mode === 'subsec_3d_grid_hover' ||
          mode === 'subsec_3d_printer_base_hover' ||
          mode === 'subsec_3d_coordinate_system_hover' ||
          mode === 'subsec_3d_build_volume_hover'
        ) {
          const containerId = (
            mode === 'subsec_3d_view_control_hover' || 
            mode === 'subsec_3d_grid_hover' ||
            mode === 'subsec_3d_printer_base_hover' ||
            mode === 'subsec_3d_coordinate_system_hover' ||
            mode === 'subsec_3d_build_volume_hover' ||
            targetElementId === 'subsec-view-control-container' || 
            targetElementId === 'subsec-view-item-views' ||
            targetElementId === 'subsec-view-item-grid' ||
            targetElementId === 'subsec-view-item-baseplate' ||
            targetElementId === 'subsec-view-item-axis' ||
            targetElementId === 'subsec-view-item-buildvolume'
          )
            ? 'subsec-view-control-container'
            : 'subsec-model-info-container';
          const containerEl = document.getElementById(containerId);
          if (containerEl) {
            const containerRect = containerEl.getBoundingClientRect();
            posX = containerRect.left - 48;
            posY = containerRect.top - 48;
          } else {
            posX = rect.left - 48;
            posY = rect.top - 48;
          }
        }
        
        // Safety bounding box constraints to keep the smiley fully within viewport dimensions
        const leftVal = `${Math.max(4, Math.min(window.innerWidth - 96 - 4, posX))}px`;
        const topVal = `${Math.max(4, Math.min(window.innerHeight - 96 - 4, posY))}px`;
        
        return { left: leftVal, top: topVal };
      }
    }

    const isDockedMode = mode === 'design_hover' || mode === 'gcode_hover' || mode === 'settings_hover' || (mode.startsWith('subsec_') && !mode.includes('_3d_'));

    const activeMsg = currentMessages[index];
    if (activeMsg) {
      let targetLeft = isDockedMode && !isSidebarCollapsed ? '228px' : (activeMsg.left || restingLeft);
      let targetTop = isDockedMode && !isSidebarCollapsed ? '72px' : getVerticalPositionValue(activeMsg.top);
      
      if (mode === 'starting' && window.innerWidth < 800) {
        targetLeft = 'calc(50vw - 48px)';
        targetTop = 'calc(20vh - 48px)';
      }
      
      return { left: targetLeft, top: targetTop };
    }

    return { left: restingLeft, top: restingTop };
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < currentMessages.length - 1) {
      setIndex(index + 1);
    } else {
      setMode('idle');
      setIsBubbleVisible(false);
      setIndex(0);
    }
  };

  return (
    <>
      <style>{`
        @keyframes nudgeArrowN { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(0, -12px); } }
        @keyframes nudgeArrowE { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(12px, 0); } }
        @keyframes nudgeArrowS { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(0, 12px); } }
        @keyframes nudgeArrowW { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-12px, 0); } }

        .animate-arrow-up { animation: nudgeArrowN 1.2s infinite ease-in-out; }
        .animate-arrow-down { animation: nudgeArrowS 1.2s infinite ease-in-out; }
        .animate-arrow-left { animation: nudgeArrowW 1.2s infinite ease-in-out; }
        .animate-arrow-right { animation: nudgeArrowE 1.2s infinite ease-in-out; }

        @keyframes floatZ {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translate(15px, -35px) scale(1.1); opacity: 0; }
        }
        .animate-float-z1 { animation: floatZ 2s infinite ease-in-out; }
        .animate-float-z2 { animation: floatZ 2s infinite ease-in-out 0.6s; }
        .animate-float-z3 { animation: floatZ 2s infinite ease-in-out 1.2s; }

        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-smiley {
          animation: floatY 4s infinite ease-in-out;
        }

        @keyframes tickleWobble {
          0% { transform: scale(1) rotate(0deg) skewX(0deg); }
          15% { transform: scale(1.08, 0.9) rotate(-3deg) skewX(-4deg); }
          30% { transform: scale(0.92, 1.05) rotate(4deg) skewX(4deg); }
          45% { transform: scale(1.06, 0.94) rotate(-3deg) skewX(-2deg); }
          60% { transform: scale(0.94, 1.04) rotate(3deg) skewX(2deg); }
          75% { transform: scale(1.03, 0.97) rotate(-1deg) skewX(-1deg); }
          100% { transform: scale(1) rotate(0deg) skewX(0deg); }
        }
        .animate-tickled-wobble {
          animation: tickleWobble 0.28s infinite ease-in-out;
        }

        @keyframes circularOrbit1 {
          0% { transform: translate(15px, 0px) scale(0.8) rotate(0deg); opacity: 0.9; }
          25% { transform: translate(50px, 8px) scale(1.3) rotate(90deg); opacity: 1; }
          50% { transform: translate(85px, 0px) scale(0.8) rotate(180deg); opacity: 0.9; }
          75% { transform: translate(50px, -8px) scale(0.5) rotate(270deg); opacity: 0.6; }
          100% { transform: translate(15px, 0px) scale(0.8) rotate(360deg); opacity: 0.9; }
        }
        @keyframes circularOrbit2 {
          0% { transform: translate(85px, 0px) scale(0.8) rotate(120deg); opacity: 0.9; }
          25% { transform: translate(50px, -8px) scale(0.5) rotate(210deg); opacity: 0.6; }
          50% { transform: translate(15px, 0px) scale(0.8) rotate(300deg); opacity: 0.9; }
          75% { transform: translate(50px, 8px) scale(1.3) rotate(390deg); opacity: 1; }
          100% { transform: translate(85px, 0px) scale(0.8) rotate(480deg); opacity: 0.9; }
        }
        @keyframes circularOrbit3 {
          0% { transform: translate(50px, -8px) scale(0.5) rotate(240deg); opacity: 0.6; }
          25% { transform: translate(15px, 0px) scale(0.8) rotate(330deg); opacity: 0.9; }
          50% { transform: translate(50px, 8px) scale(1.3) rotate(420deg); opacity: 1; }
          75% { transform: translate(85px, 0px) scale(0.8) rotate(510deg); opacity: 0.9; }
          100% { transform: translate(50px, -8px) scale(0.5) rotate(600deg); opacity: 0.6; }
        }
        .animate-orbit1 { animation: circularOrbit1 1.5s infinite linear; }
        .animate-orbit2 { animation: circularOrbit2 1.5s infinite linear; }
        .animate-orbit3 { animation: circularOrbit3 1.5s infinite linear; }
      `}</style>
      
      {(() => {
        const coords = getCoordinates();
        const smileyLeft = parseFloat(coords.left) || 0;
        const smileyTop = parseFloat(coords.top) || 0;

        let isLeftPlacedBubble = [
          'subsec_3d_build_volume_hover',
          'subsec_3d_model_hover',
          'subsec_3d_path_hover',
          'subsec_3d_printer_base_hover',
          'subsec_3d_coordinate_system_hover',
          'subsec_3d_grid_hover',
          'subsec_3d_view_control_hover',
          'subsec_3d_model_info_hover',
          'subsec_import_hover',
          'subsec_language_hover',
          'subsec_smiley_hover'
        ].includes(mode);

        // Adjust placement dynamically based on viewport constraints so bubble is safe from offscreen overflow
        if (isLeftPlacedBubble && smileyLeft < 260) {
          isLeftPlacedBubble = false;
        } else if (!isLeftPlacedBubble && (window.innerWidth - smileyLeft - 96 < 260)) {
          isLeftPlacedBubble = true;
        }

        // Force the starting tutorial bubbles to always appear on the right on desktop, where there is empty space
        if (mode === 'starting' && window.innerWidth >= 800) {
          isLeftPlacedBubble = false;
        }

        // Determine actual placement configuration
        const bubblePlacement = (mode === 'starting' && window.innerWidth < 800) ? 'below' : (isLeftPlacedBubble ? 'left' : 'right');

        // Calculate dynamic maximum width for the speech bubble so it never overflows the layout boundaries
        let dynamicMaxWidth = 360; 
        if (bubblePlacement === 'below') {
          dynamicMaxWidth = Math.min(385, window.innerWidth - 32);
        } else if (bubblePlacement === 'left') {
          dynamicMaxWidth = Math.max(220, smileyLeft - 48);
        } else {
          dynamicMaxWidth = Math.max(220, window.innerWidth - smileyLeft - 96 - 48);
        }
        dynamicMaxWidth = Math.min(420, dynamicMaxWidth);

        const getBubbleBorderColor = () => {
          if (!mode) return '#000000';
          switch (mode) {
            case 'subsec_size_hover': return '#df3062';
            case 'subsec_shape_hover': return '#4F46E5';
            case 'subsec_texture_hover': return '#059669';
            case 'subsec_ribs_hover': return '#0284C7';
            case 'subsec_deformations_hover': return '#D97706';
            case 'subsec_appearance_hover': return '#8E44AD';
            case 'subsec_settings_printer_hover': return '#EA580C';
            case 'subsec_settings_sizes_hover': return '#2563EB';
            case 'subsec_gcode_playback_hover': return '#EF4444';
            case 'subsec_gcode_texture_hover': return '#D97706';
            case 'subsec_gcode_stats_hover': return '#0D9488';
            case 'subsec_gcode_command_hover': return '#D97706';
            case 'subsec_gcode_description_hover': return '#8E44AD';
            case 'subsec_save_name_hover': return '#78716C';
            case 'subsec_save_guide_hover': return '#EA580C';
            case 'subsec_save_model_cup_hover': return '#4F46E5';
            case 'subsec_save_model_stl_hover': return '#10B981';
            case 'subsec_save_picture_hover': return '#9333EA';
            case 'subsec_import_hover': return '#7F7F7F';
            case 'subsec_language_hover': return '#7F7F7F';
            case 'subsec_smiley_hover': return '#7F7F7F';
            default: return '#000000';
          }
        };
        const bubbleBorderColor = getBubbleBorderColor();

        const renderBubbleBody = () => {
          if (mode === 'starting' && index === 1) {
            const startLines = typedText.split('\n');
            const hasHeader = startLines.length >= 1;
            const hasStep1 = startLines.length >= 2;
            const hasStep2 = startLines.length >= 3;
            const hasStep3 = startLines.length >= 4;

            const headTxt = startLines[0] || '';
            const step1Txt = startLines[1] ? startLines[1].replace(/^\d+\.\s*/, '') : '';
            const step2Txt = startLines[2] ? startLines[2].replace(/^\d+\.\s*/, '') : '';
            const step3Txt = startLines[3] ? startLines[3].replace(/^\d+\.\s*/, '') : '';

            return (
              <div className="flex flex-col gap-1.5 my-1 font-sans text-slate-950 w-full">
                {hasHeader && (
                  <p className="speech-bubble-p text-slate-950 font-extrabold leading-tight mb-0.5 font-sans tracking-wide px-1 select-none w-full">
                    {headTxt}
                  </p>
                )}
                
                {/* Vertical visual stepper matching the picture perfectly */}
                <div className="flex flex-col select-none gap-2 pl-1 w-full">
                  {/* Step 1 */}
                  {hasStep1 && step1Txt.trim() !== '' && (
                    <motion.div 
                      key="start-step-1"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 w-full"
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-[24px] h-[26px] rounded-full flex items-center justify-center font-black text-white text-[10px] bg-[#10B981] border-2 border-[#15803D] shadow-sm select-none">
                          1
                        </div>
                      </div>
                      <div className="speech-bubble-p text-slate-950 font-extrabold leading-tight flex-1 font-sans tracking-wide whitespace-pre-line px-1 align-middle select-none">
                        {renderFormattedText(step1Txt)}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 */}
                  {hasStep2 && step2Txt.trim() !== '' && (
                    <motion.div 
                      key="start-step-2"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 w-full"
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-[24px] h-[26px] rounded-full flex items-center justify-center font-black text-white text-[10px] bg-[#9A3412] border-2 border-[#7C2D12] shadow-sm select-none">
                          2
                        </div>
                      </div>
                      <div className="speech-bubble-p text-slate-950 font-extrabold leading-tight flex-1 font-sans tracking-wide whitespace-pre-line px-1 align-middle select-none">
                        {renderFormattedText(step2Txt)}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3 */}
                  {hasStep3 && step3Txt.trim() !== '' && (
                    <motion.div 
                      key="start-step-3"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 w-full"
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-[24px] h-[26px] rounded-full flex items-center justify-center font-black text-white text-[10px] bg-[#F59E0B] border-2 border-[#D97706] shadow-sm select-none">
                          3
                        </div>
                      </div>
                      <div className="speech-bubble-p text-slate-950 font-extrabold leading-tight flex-1 font-sans tracking-wide whitespace-pre-line px-1 align-middle select-none">
                        {renderFormattedText(step3Txt)}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            );
          }

          // Default fallback
          return (
            <p className="speech-bubble-p text-slate-950 font-extrabold leading-tight mb-0 font-sans tracking-wide px-1 select-none whitespace-pre-line">
              {renderFormattedText(typedText)}
            </p>
          );
        };

        let faceColor = morphedColor || (isGiddy ? '#84CC16' : '#FFEB3B');
        let faceNumber: string | null = null;

        if (mode === 'design_hover' || highlightedSection === 'design') {
          faceColor = '#15803D';
          faceNumber = '1';
        } else if (mode === 'gcode_hover' || highlightedSection === 'gcode' || mode === 'subsec_gcode_texture_hover' || highlightedSection === 'subsec-gcode-texture') {
          faceColor = '#854D0E';
          faceNumber = '2';
        } else if (mode === 'save_hover' || highlightedSection === 'save') {
          faceColor = '#EA580C';
          faceNumber = '3';
        }

        return (
          <motion.div 
            animate={getCoordinates()}
            transition={
              mode === 'idle'
                ? { type: "spring", stiffness: 120, damping: 20 }
                : { type: "tween", ease: "circOut", duration: 0.22 }
            }
            className="fixed z-[9999] select-none pointer-events-none w-[96px] h-[96px]"
          >
        {/* Rounded Tip Pointer Arrow Indicator */}
        {arrowConfig && (
          <div 
            className={`absolute select-none pointer-events-none animate-arrow-${arrowConfig.direction}`}
            style={arrowConfig.style}
          >
            <ArrowSVG direction={arrowConfig.direction} strokeWidth={4.2} />
          </div>
        )}

        {/* Double-Sized Floating SVGMapped Smiley */}
        <motion.div 
          ref={smileyRef}
          onClick={handleSmileyClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`w-[96px] h-[96px] cursor-grab active:cursor-grabbing relative shrink-0 pointer-events-auto mt-4 touch-none overflow-visible ${isTickled ? 'animate-tickled-wobble' : ''}`}
          animate={{
            x: offset.x,
            y: offset.y,
            scale: (mode === 'starting' ? 1.6 : 1.0) * (morphedShape === ShapeType.STAR ? 1.2 : 1.0)
          }}
          style={{ touchAction: 'none' }}
          transition={{
            y: {
              type: "tween",
              duration: 0
            },
            x: {
              type: "tween",
              duration: 0
            },
            scale: {
              type: "spring",
              stiffness: 100,
              damping: 15
            }
          }}
          whileHover={{ scale: (mode === 'starting' ? 1.65 : 1.05) * (morphedShape === ShapeType.STAR ? 1.2 : 1.0) }}
          whileTap={{ scale: (mode === 'starting' ? 1.55 : 0.95) * (morphedShape === ShapeType.STAR ? 1.2 : 1.0) }}
        >
          {/* Inner wrapper for floating bobbing animation */}
          <div className={(!isDraggingState && offset.x === 0 && offset.y === 0) ? "animate-float-smiley w-full h-full overflow-visible" : "w-full h-full overflow-visible"}>
            {isSleeping && (
              <div className="absolute top-0 right-0 pointer-events-none select-none">
                <span className="absolute text-slate-900 font-extrabold text-lg animate-float-z1" style={{ left: '0px', top: '-10px' }}>z</span>
                <span className="absolute text-slate-900 font-extrabold text-sm animate-float-z2" style={{ left: '12px', top: '-18px' }}>z</span>
                <span className="absolute text-slate-900 font-extrabold text-xs animate-float-z3" style={{ left: '22px', top: '-24px' }}>z</span>
              </div>
            )}

            {/* Dynamic stroke scale calculation to ensure identical visual line width under starts scale(1.6) */}
            <svg 
              viewBox="0 0 100 100" 
              className="w-[96px] h-[96px] drop-shadow-[0_10px_20px_rgba(15,23,42,0.12)] pointer-events-none overflow-visible"
              style={squashStyle}
            >
            <defs>
              <pattern id={`pattern-${TextureType.DOTS}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="6" cy="6" r="2.2" fill={morphedTextureReverse ? "#ffffff" : "#000000"} opacity={morphedTextureFade ? "0.18" : "0.35"} />
              </pattern>
              <pattern id={`pattern-${TextureType.WAVY}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 0 4 Q 4 8, 8 4 T 16 4" fill="none" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="2.2" strokeLinecap="round" opacity={morphedTextureFade ? "0.18" : "0.35"} />
                <path d="M 0 12 Q 4 16, 8 12 T 16 12" fill="none" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="2.2" strokeLinecap="round" opacity={morphedTextureFade ? "0.18" : "0.35"} />
              </pattern>
              <pattern id={`pattern-${TextureType.STRIPES}`} x="0" y="0" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="6" x2="12" y2="6" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="2.5" opacity={morphedTextureFade ? "0.18" : "0.35"} />
              </pattern>
              <pattern id={`pattern-${TextureType.FLUTED}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <line x1="4" y1="0" x2="4" y2="16" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="2.2" strokeLinecap="round" opacity={morphedTextureFade ? "0.18" : "0.35"} />
                <line x1="12" y1="0" x2="12" y2="16" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="2.2" strokeLinecap="round" opacity={morphedTextureFade ? "0.18" : "0.35"} />
              </pattern>
              <pattern id={`pattern-${TextureType.DIAMOND}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 0 8 L 8 0 L 16 8 L 8 16 Z" fill="none" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="1.5" opacity={morphedTextureFade ? "0.18" : "0.35"} />
                <path d="M 8 8 L 12 4 M 8 8 L 12 12 M 8 8 L 4 4 M 8 8 L 4 12" fill="none" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="1.2" opacity={morphedTextureFade ? "0.12" : "0.22"} />
              </pattern>
              <pattern id={`pattern-${TextureType.SCALES}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 0 10 Q 5 5, 10 10 T 20 10 M 0 20 Q 5 15, 10 20 T 20 20 M -5 15 Q 0 10, 5 15 T 15 15" fill="none" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="1.3" opacity={morphedTextureFade ? "0.18" : "0.35"} />
              </pattern>
              <pattern id={`pattern-${TextureType.PIXEL}`} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                <rect x="1" y="1" width="12" height="12" fill="none" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="1.2" opacity={morphedTextureFade ? "0.18" : "0.35"} rx="1" />
              </pattern>
              <pattern id={`pattern-${TextureType.BUBBLE}`} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="6" cy="6" r="3" fill="none" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="1.2" opacity={morphedTextureFade ? "0.18" : "0.35"} />
                <circle cx="16" cy="14" r="5" fill="none" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="1.2" opacity={morphedTextureFade ? "0.18" : "0.35"} />
                <circle cx="8" cy="18" r="2" fill="none" stroke={morphedTextureReverse ? "#ffffff" : "#000000"} strokeWidth="1.2" opacity={morphedTextureFade ? "0.18" : "0.35"} />
              </pattern>
              <radialGradient id="smarties-depth-overlay" cx="30%" cy="30%" r="65%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="40%" stopColor="#ffffff" stopOpacity="0.0" />
                <stop offset="85%" stopColor="#542004" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#4a1801" stopOpacity="0.38" />
              </radialGradient>
            </defs>
            <g style={{ transform: `rotate(${activeRotation}deg)`, transformOrigin: '50px 50px', transition: 'transform 150ms ease-out' }}>
            {/* Bright yellow / lime green circular face with smooth transitions, utilizing dynamic path for flats */}
            <path 
              d={morphedPath || faceLayout.path}
              fill={faceColor} 
              className="transition-all duration-150 ease-out"
              style={{ transitionProperty: 'd, fill', transitionDuration: '150ms, 600ms' }} 
              stroke="#000000" 
              strokeWidth={mode === 'starting' ? (isInflating ? 2.625 / 1.25 : 2.625) : (isInflating ? 4.2 / 1.25 : 4.2)} 
              vectorEffect="non-scaling-stroke"
            />

            {/* Render temporary texture pattern layer if active */}
            {morphedTexture && morphedTexture !== TextureType.NONE && (
              <path 
                d={morphedPath || faceLayout.path}
                fill={`url(#pattern-${morphedTexture})`}
                className="pointer-events-none transition-all duration-150 ease-out"
              />
            )}

            {/* Smarties Shading Overlay */}
            <path 
              d={morphedPath || faceLayout.path}
              fill="url(#smarties-depth-overlay)"
              className="pointer-events-none transition-all duration-150 ease-out"
              style={{ transitionProperty: 'd', transitionDuration: '150ms' }}
            />

            {/* Glossy specular highlight ellipse */}
            <ellipse 
              cx="36" 
              cy="24" 
              rx="7.5" 
              ry="3.2" 
              transform="rotate(-28 36 24)" 
              fill="#ffffff" 
              opacity="0.55" 
              className="pointer-events-none"
            />

            {/* Stage indicator number displayed onto face behind eyes & mouth */}
            {faceNumber && (
              <text
                x="50"
                y="56"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="38"
                fontWeight="900"
                fill="#000000"
                opacity="0.45"
                style={{ fontFamily: 'var(--font-mono, monospace)', pointerEvents: 'none', userSelect: 'none' }}
              >
                {faceNumber}
              </text>
            )}

            {/* Cute Rosy Cheeks when reinflating - rounder, lower, wider apart, following face translation */}
            {isInflating && (
              <g className="transition-opacity duration-300 pointer-events-none" transform={`translate(${eyeGroupOffset.x}, ${eyeGroupOffset.y})`}>
                {/* Left rosy cheek, perfectly positioned outwards/downwards of left eye */}
                <ellipse cx="22" cy="55" rx="8.5" ry="8" fill="#FF4D6D" opacity="0.55" />
                {/* Right rosy cheek, perfectly positioned outwards/downwards of right eye */}
                <ellipse cx="78" cy="55" rx="8.5" ry="8" fill="#FF4D6D" opacity="0.55" />
              </g>
            )}
            
            {(collisionDir || isSleeping || isInflating || isTickled) ? (
              <g transform={`translate(${eyeGroupOffset.x}, ${eyeGroupOffset.y})`}>
                {isTickled ? (
                  <>
                    {/* Tickled laughing eyes (closed-happy curves like ^ ^) */}
                    <path d="M 28 44 Q 36 34 44 44" fill="none" stroke="#000000" strokeWidth={mode === 'starting' ? 2.40625 : 3.85} strokeLinecap="round" />
                    <path d="M 56 44 Q 64 34 72 44" fill="none" stroke="#000000" strokeWidth={mode === 'starting' ? 2.40625 : 3.85} strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <path 
                      d="M 28 41 Q 36 48 44 41" 
                      fill="none" 
                      stroke="#000000" 
                      strokeWidth={mode === 'starting' ? (isInflating ? 2.40625 / 1.25 : 2.40625) : (isInflating ? 3.85 / 1.25 : 3.85)} 
                      strokeLinecap="round" 
                      vectorEffect="non-scaling-stroke"
                    />
                    <path 
                      d="M 56 41 Q 64 48 72 41" 
                      fill="none" 
                      stroke="#000000" 
                      strokeWidth={mode === 'starting' ? (isInflating ? 2.40625 / 1.25 : 2.40625) : (isInflating ? 3.85 / 1.25 : 3.85)} 
                      strokeLinecap="round" 
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </g>
            ) : isYawning ? (
              <g transform={`translate(${eyeGroupOffset.x}, ${eyeGroupOffset.y})`}>
                {/* Yawning closed eyes (like happy closed curve ^ ^) */}
                <path d="M 28 44 Q 36 34 44 44" fill="none" stroke="#000000" strokeWidth={mode === 'starting' ? 2.40625 : 3.85} strokeLinecap="round" />
                <path d="M 56 44 Q 64 34 72 44" fill="none" stroke="#000000" strokeWidth={mode === 'starting' ? 2.40625 : 3.85} strokeLinecap="round" />
              </g>
            ) : (
              <>
                {/* Left Eye */}
                <motion.ellipse 
                   cx={clampedLeftEye.x} 
                   cy={clampedLeftEye.y} 
                   rx={activeRx} 
                   ry={activeRy}
                   animate={{ scaleY: isBlinking ? 0.08 : 1 }}
                   transition={{ duration: 0.08 }}
                   style={{ transformOrigin: `${clampedLeftEye.x}px ${clampedLeftEye.y}px` }}
                   fill="#000000"
                />
                
                {/* Right Eye */}
                <motion.ellipse 
                   cx={clampedRightEye.x} 
                   cy={clampedRightEye.y} 
                   rx={activeRx} 
                   ry={activeRy}
                   animate={{ scaleY: isBlinking ? 0.08 : 1 }}
                   transition={{ duration: 0.08 }}
                   style={{ transformOrigin: `${clampedRightEye.x}px ${clampedRightEye.y}px` }}
                   fill="#000000"
                />
              </>
            )}
            
            {/* Mouth group with responsive subtle translation to produce head-tilt/turn depth effect */}
            <g transform={`translate(${mouthOffset.x}, ${mouthOffset.y})`}>
              {isTickled ? (
                <motion.path 
                  d="M 32 60 Q 50 86 68 60 Z" 
                  fill="#000000" 
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 0.2, ease: "easeInOut" }}
                  style={{ transformOrigin: "50px 68px" }}
                />
              ) : showStarsAndSad ? (
                <path 
                  d="M 28 72 Q 50 52 72 72" 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth={mode === 'starting' ? 2.84375 : 4.55} 
                  strokeLinecap="round" 
                />
              ) : isInflating ? (
                <path 
                  d="M 40 58 L 60 78 M 60 58 L 40 78" 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth={mode === 'starting' ? 3.3 / 1.25 : 5.2 / 1.25} 
                  strokeLinecap="round" 
                  vectorEffect="non-scaling-stroke"
                />
              ) : collisionDir ? (
                <path 
                  d="M 28 68 L 72 68" 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth={mode === 'starting' ? 2.84375 : 4.55} 
                  strokeLinecap="round" 
                />
              ) : isSleeping ? (
                <motion.circle 
                  cx="50" 
                  cy="68" 
                  r={8} 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth={mode === 'starting' ? 2.40625 : 3.85} 
                  animate={{ r: [6, 11, 6] }} 
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }} 
                />
              ) : isYawning ? (
                <motion.ellipse 
                  cx="50" 
                  cy="68" 
                  rx="9" 
                  ry="12" 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth={mode === 'starting' ? 2.40625 : 3.85}
                  animate={{ ry: [9, 13, 9] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                />
              ) : (
                <motion.path 
                  d="M 28 62 Q 50 82 72 62" 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth={mode === 'starting' ? 2.84375 : 4.55} 
                  strokeLinecap="round" 
                  animate={isGiddy ? {
                    d: [
                      "M 28 62 Q 33.5 72 39 62 Q 44.5 52 50 62 Q 55.5 72 61 62 Q 66.5 52 72 62", 
                      "M 28 62 Q 33.5 52 39 62 Q 44.5 72 50 62 Q 55.5 52 61 62 Q 66.5 72 72 62",
                      "M 28 62 Q 33.5 72 39 62 Q 44.5 52 50 62 Q 55.5 72 61 62 Q 66.5 52 72 62"
                    ]
                  } : {
                    d: "M 28 62 Q 50 82 72 62"
                  }}
                  transition={isGiddy ? {
                    duration: 0.18,
                    repeat: Infinity
                  } : {}}
                />
              )}
            </g>
          </g>
          {showStarsAndSad && (
            <g className="pointer-events-none">
              {/* Star 1 */}
              <g className="animate-orbit1">
                <path 
                  d="M 0 -6 L 1.8 -1.8 L 6.4 -1.8 L 2.7 1 L 4.1 5.6 L 0 2.8 L -4.1 5.6 L -2.7 1 L -6.4 -1.8 L -1.8 -1.8 Z" 
                  fill="#FBBF24" 
                  stroke="#000000"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
              {/* Star 2 */}
              <g className="animate-orbit2">
                <path 
                  d="M 0 -6 L 1.8 -1.8 L 6.4 -1.8 L 2.7 1 L 4.1 5.6 L 0 2.8 L -4.1 5.6 L -2.7 1 L -6.4 -1.8 L -1.8 -1.8 Z" 
                  fill="#FBBF24" 
                  stroke="#000000"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
              {/* Star 3 */}
              <g className="animate-orbit3">
                <path 
                  d="M 0 -6 L 1.8 -1.8 L 6.4 -1.8 L 2.7 1 L 4.1 5.6 L 0 2.8 L -4.1 5.6 L -2.7 1 L -6.4 -1.8 L -1.8 -1.8 Z" 
                  fill="#FBBF24" 
                  stroke="#000000"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </g>
          )}
          </svg>
          </div>
        </motion.div>

        {/* Comic Speech Bubble */}
        <AnimatePresence>
          {isTickled ? (
            <motion.div 
               key="tickled-bubble"
               initial={{ 
                 opacity: 0, 
                 scale: 0.9, 
                 x: bubblePlacement === 'below' ? '-50%' : (bubblePlacement === 'left' ? 10 : -10),
                 y: bubblePlacement === 'below' ? -10 : 0
               }}
               animate={{ 
                 opacity: 1, 
                 scale: 1, 
                 x: bubblePlacement === 'below' ? '-50%' : 0,
                 y: 0 
               }}
               exit={{ 
                 opacity: 0, 
                 scale: 0.9, 
                 x: bubblePlacement === 'below' ? '-50%' : (bubblePlacement === 'left' ? 10 : -10),
                 y: bubblePlacement === 'below' ? -10 : 0
               }}
               className={`bg-white border-[3px] border-amber-400 p-3 rounded-2xl shadow-[0_8px_24px_rgba(245,158,11,0.2)] text-left pointer-events-auto absolute ${
                 bubblePlacement === 'below' 
                   ? (mode === 'starting' ? 'top-[132px] left-[50%]' : 'top-[112px] left-[50%]')
                   : (bubblePlacement === 'left' 
                       ? (mode === 'starting' ? 'top-4 right-[132px]' : 'top-4 right-[112px]') 
                       : (mode === 'starting' ? 'top-4 left-[132px]' : 'top-4 left-[112px]'))
               }`}
               style={{ maxWidth: `${dynamicMaxWidth}px` }}
            >
               {/* Speech bubble arrow tail pointing to the smiley */}
               {bubblePlacement === 'below' ? (
                 <div className="absolute w-[24px] h-[26px] pointer-events-none" style={{ top: '-21.5px', left: 'calc(50% - 12px)' }}>
                   <svg width="24" height="26" viewBox="0 0 24 26" fill="none" className="overflow-visible">
                     <polygon points="12,3 0,24 24,24" fill="#F59E0B" />
                     <polygon points="12,10.5 -3,29 27,29" fill="#ffffff" />
                   </svg>
                 </div>
               ) : bubblePlacement === 'left' ? (
                 <div className="absolute w-[26px] h-[24px] pointer-events-none" style={{ right: '-21.5px', top: '18px' }}>
                   <svg width="26" height="24" viewBox="0 0 26 24" fill="none" className="overflow-visible">
                     <polygon points="0,3 22,12 0,21" fill="#F59E0B" />
                     <polygon points="-3,5.4 15.5,12 -3,18.6" fill="#ffffff" />
                   </svg>
                 </div>
               ) : (
                 <div className="absolute w-[26px] h-[24px] pointer-events-none" style={{ left: '-21.5px', top: '18px' }}>
                   <svg width="26" height="24" viewBox="0 0 26 24" fill="none" className="overflow-visible">
                     <polygon points="26,3 4,12 26,21" fill="#F59E0B" />
                     <polygon points="29,5.4 10.5,12 29,18.6" fill="#ffffff" />
                   </svg>
                 </div>
               )}
               <div className="relative z-10 flex flex-col items-center justify-center py-1">
                 <p className="speech-bubble-p text-amber-500 font-black text-[10px] uppercase tracking-widest text-center animate-bounce mb-1 select-none">
                   {language === 'cy' ? 'HA CEI GOGLAIS!' : 'HA THAT TICKLES!'}
                 </p>
                 <p className="speech-bubble-p text-slate-950 font-extrabold leading-tight mb-0 font-sans tracking-wide px-1 select-none whitespace-pre-line text-[13px] text-center">
                   {tickleText}
                 </p>
               </div>
            </motion.div>
          ) : customAlert ? (
            <motion.div 
               key="custom-alert-bubble"
               initial={{ 
                 opacity: 0, 
                 scale: 0.9, 
                 x: bubblePlacement === 'below' ? '-50%' : (bubblePlacement === 'left' ? 10 : -10),
                 y: bubblePlacement === 'below' ? -10 : 0
               }}
               animate={{ 
                 opacity: 1, 
                 scale: 1, 
                 x: bubblePlacement === 'below' ? '-50%' : 0,
                 y: 0 
               }}
               exit={{ 
                 opacity: 0, 
                 scale: 0.9, 
                 x: bubblePlacement === 'below' ? '-50%' : (bubblePlacement === 'left' ? 10 : -10),
                 y: bubblePlacement === 'below' ? -10 : 0
               }}
               className={`bg-white border-[3px] border-amber-500 p-3.5 rounded-2xl shadow-[0_8px_24px_rgba(245,158,11,0.25)] text-left pointer-events-auto absolute ${
                 bubblePlacement === 'below' 
                   ? (mode === 'starting' ? 'top-[132px] left-[50%]' : 'top-[112px] left-[50%]')
                   : (bubblePlacement === 'left' 
                       ? (mode === 'starting' ? 'top-4 right-[132px]' : 'top-4 right-[112px]') 
                       : (mode === 'starting' ? 'top-4 left-[132px]' : 'top-4 left-[112px]'))
               }`}
               style={{ maxWidth: `${dynamicMaxWidth}px` }}
            >
               {/* Speech bubble arrow tail pointing to the smiley */}
               {bubblePlacement === 'below' ? (
                 <div className="absolute w-[24px] h-[26px] pointer-events-none" style={{ top: '-21.5px', left: 'calc(50% - 12px)' }}>
                   <svg width="24" height="26" viewBox="0 0 24 26" fill="none" className="overflow-visible">
                     <polygon points="12,3 0,24 24,24" fill="#F59E0B" />
                     <polygon points="12,10.5 -3,29 27,29" fill="#ffffff" />
                   </svg>
                 </div>
               ) : bubblePlacement === 'left' ? (
                 <div className="absolute w-[26px] h-[24px] pointer-events-none" style={{ right: '-21.5px', top: '18px' }}>
                   <svg width="26" height="24" viewBox="0 0 26 24" fill="none" className="overflow-visible">
                     <polygon points="0,3 22,12 0,21" fill="#F59E0B" />
                     <polygon points="-3,5.4 15.5,12 -3,18.6" fill="#ffffff" />
                   </svg>
                 </div>
               ) : (
                 <div className="absolute w-[26px] h-[24px] pointer-events-none" style={{ left: '-21.5px', top: '18px' }}>
                   <svg width="26" height="24" viewBox="0 0 26 24" fill="none" className="overflow-visible">
                     <polygon points="26,3 4,12 26,21" fill="#F59E0B" />
                     <polygon points="29,5.4 10.5,12 29,18.6" fill="#ffffff" />
                   </svg>
                 </div>
               )}
               <div className="relative z-10 flex flex-col items-center justify-center py-1 min-w-[210px]">
                 <p className="speech-bubble-p text-slate-950 font-extrabold leading-normal mb-3 font-sans tracking-wide px-1 select-none whitespace-pre-line text-[12px] text-center">
                   {language === 'cy' ? customAlert.textCy : customAlert.text}
                 </p>
                 <button
                   onClick={() => setCustomAlert(null)}
                   className="px-5 py-1 bg-[#EA580C] hover:bg-[#EA580C]/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95"
                 >
                   {language === 'cy' ? 'Iawn' : 'OK'}
                 </button>
               </div>
            </motion.div>
          ) : isBubbleVisible && currentMessages[index]?.text ? (
            <motion.div 
               initial={{ 
                 opacity: 0, 
                 scale: 0.9, 
                 x: bubblePlacement === 'below' ? '-50%' : (bubblePlacement === 'left' ? 10 : -10),
                 y: bubblePlacement === 'below' ? -10 : 0
               }}
               animate={{ 
                 opacity: 1, 
                 scale: 1, 
                 x: bubblePlacement === 'below' ? '-50%' : 0,
                 y: 0 
               }}
               exit={{ 
                 opacity: 0, 
                 scale: 0.9, 
                 x: bubblePlacement === 'below' ? '-50%' : (bubblePlacement === 'left' ? 10 : -10),
                 y: bubblePlacement === 'below' ? -10 : 0
               }}
               className={`bg-white border-[3px] p-2.5 rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.1)] text-left pointer-events-auto absolute ${
                 bubblePlacement === 'below' 
                   ? (mode === 'starting' ? 'top-[132px] left-[50%]' : 'top-[112px] left-[50%]')
                   : (bubblePlacement === 'left' 
                       ? (mode === 'starting' ? 'top-4 right-[132px]' : 'top-4 right-[112px]') 
                       : (mode === 'starting' ? 'top-4 left-[132px]' : 'top-4 left-[112px]'))
               }`}
               style={{ borderColor: bubbleBorderColor, maxWidth: `${dynamicMaxWidth}px` }}
            >
               {/* Speech bubble arrows/tails */}
               {bubblePlacement === 'below' ? (
                 /* Pointer pointing up to the smiley when the bubble is below */
                 <div 
                   className="absolute w-[24px] h-[26px] pointer-events-none"
                   style={{
                     top: '-21.5px', // overlaps the bubble border nicely
                     left: 'calc(50% - 12px)', // centered
                   }}
                 >
                   <svg width="24" height="26" viewBox="0 0 24 26" fill="none" className="overflow-visible">
                     {/* Outer border shape */}
                     <polygon 
                       points="12,3 0,24 24,24" 
                       fill={bubbleBorderColor}
                     />
                     {/* Inner white fill to overlay the borders */}
                     <polygon 
                       points="12,10.5 -3,29 27,29" 
                       fill="#ffffff"
                     />
                   </svg>
                 </div>
               ) : bubblePlacement === 'left' ? (
                 /* Pointer pointing right to the smiley when the bubble is on the left */
                 <div 
                   className="absolute w-[26px] h-[24px] pointer-events-none"
                   style={{
                     right: '-21.5px', // overlaps the bubble border nicely
                     top: '18px', // aligned near upper middle
                   }}
                 >
                   <svg width="26" height="24" viewBox="0 0 26 24" fill="none" className="overflow-visible">
                     {/* Outer border shape */}
                     <polygon 
                       points="0,3 22,12 0,21" 
                       fill={bubbleBorderColor}
                     />
                     {/* Inner white fill to overlay the borders */}
                     <polygon 
                       points="-3,5.4 15.5,12 -3,18.6" 
                       fill="#ffffff"
                     />
                   </svg>
                 </div>
               ) : (
                 /* Pointer pointing left to the smiley when the bubble is on the right */
                 <div 
                   className="absolute w-[26px] h-[24px] pointer-events-none"
                   style={{
                     left: '-21.5px', // overlaps the bubble border nicely
                     top: '18px', // aligned near upper middle
                   }}
                 >
                   <svg width="26" height="24" viewBox="0 0 26 24" fill="none" className="overflow-visible">
                     {/* Outer border shape */}
                     <polygon 
                       points="26,3 4,12 26,21" 
                       fill={bubbleBorderColor}
                     />
                     {/* Inner white fill to overlap the borders */}
                     <polygon 
                       points="29,5.4 10.5,12 29,18.6" 
                       fill="#ffffff"
                     />
                   </svg>
                 </div>
               )}
              <div className="relative z-10 flex flex-col gap-1.5 min-w-[210px]">
                {/* Comic-style Navigation buttons - moved to top with no framing and bg */}
                <div className="flex justify-between items-center pb-1 border-b border-slate-100 gap-1.5 mb-0.5">
                  <button
                    onClick={handlePrev}
                    disabled={index === 0}
                    className="flex-1 py-0.5 text-center text-[9px] font-black uppercase tracking-wider text-black hover:text-slate-500 bg-transparent border-0 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none"
                  >
                    &lt; {language === 'cy' ? 'Yn ôl' : 'Back'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMode('idle');
                      setIsBubbleVisible(false);
                      setIndex(0);
                    }}
                    className="flex-1 py-0.5 flex items-center justify-center gap-1 speech-bubble-btn text-center text-[9px] font-black uppercase tracking-wider text-red-600 hover:text-red-800 bg-transparent border-0 transition-colors cursor-pointer select-none"
                    title={language === 'cy' ? "Hepgor y tywysydd hwn" : "Skip this guide"}
                  >
                    <span>{language === 'cy' ? "Hepgor" : "Skip"}</span>
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={mode === 'starting' && index === 0}
                    className="flex-1 py-0.5 text-center text-[9px] font-black uppercase tracking-wider text-black hover:text-slate-500 bg-transparent border-0 transition-colors cursor-pointer select-none disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {index === currentMessages.length - 1 
                      ? (language === 'cy' ? 'Gorffen' : 'Finish') 
                      : (language === 'cy' ? 'Nesaf >' : 'Next >')}
                  </button>
                </div>

                {renderBubbleBody()}

                {/* Language Selector in Starting (Intro) Speech - No extra framing, Welsh first, flags 30% larger */}
                {mode === 'starting' && index === 0 && (
                   <div className="flex gap-2 mt-1.5 justify-center">
                     <button
                       onClick={() => {
                         setLanguage('cy');
                         setIndex(1);
                       }}
                       className="flex-1 flex items-center justify-center gap-1 py-0.5 text-[9px] font-black uppercase tracking-wider cursor-pointer hover:text-slate-600 text-black bg-transparent border-0 transition-colors"
                     >
                       <WelshFlagSVG className="w-[26px] h-[26px]" />
                       <span>Cymraeg</span>
                     </button>
                     <button
                       onClick={() => {
                         setLanguage('en');
                         setIndex(1);
                       }}
                       className="flex-1 flex items-center justify-center gap-1 py-0.5 text-[9px] font-black uppercase tracking-wider cursor-pointer hover:text-slate-600 text-black bg-transparent border-0 transition-colors"
                     >
                       <UKFlagSVG className="w-[26px] h-[26px]" />
                       <span>English</span>
                     </button>
                   </div>
                 )}

                {/* Message Index counter - moved to the bottom */}
                <div className="flex justify-end pr-1 text-[9px] font-mono font-bold tracking-wider text-slate-400 select-none mt-0.5">
                  {index + 1} / {currentMessages.length}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
          </motion.div>
        );
      })()}
    </>
  );
};

export default CursorSmiley;
