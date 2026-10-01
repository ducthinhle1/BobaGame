// Mèo Trân Châu — static game data: menu, prices, customer types, levels, shop items, staff.
// Tune the game here; the game logic lives in src/game/ and src/logic/.
import type {DecorItem,PlaceInfo,PlaceId,VisitorCat,Tea,Topping,QualityInfo,Quality,CustomerType,TypeId,SupplyItem,ShopItem,StaffInfo,GameEvent,Season,Regular} from './types';

// brew: each tea always uses the same prep mini game (steep = lift the tea bag in time,
// heat = keep the water in the green zone, whisk = whisk up the foam)
export const TEAS:Tea[]=[
  {id:'black',name:'Trà sữa Mèo Mun',short:'Mèo Mun',vi:'Trà đen sữa',color:'#C08A5B',price:25,brew:'steep'},
  {id:'jasmine',name:'Trà lài Mèo Vàng',short:'Mèo Vàng',vi:'Trà lài sữa',color:'#D6CB7E',price:25,brew:'heat'},
  {id:'taro',name:'Khoai môn Mèo Tím',short:'Mèo Tím',vi:'Khoai môn sữa',color:'#B79BD6',price:30,brew:'heat'},
  {id:'matcha',name:'Matcha Mắt Mèo',short:'Mắt Mèo',vi:'Matcha sữa',color:'#8FBF6A',price:32,brew:'whisk',day:2},
  {id:'thai',name:'Trà Thái Mèo Cam',short:'Mèo Cam',vi:'Trà Thái sữa',color:'#E8894A',price:30,brew:'steep',day:3},
  // limited-time seasonal drinks (on the menu only during their season)
  {id:'dao',name:'Trà Đào Cam Sả',short:'Trà Đào',vi:'Trà đào cam sả',color:'#F7A86B',price:35,brew:'steep',season:'he'},
  {id:'banhdeo',name:'Trà sữa Bánh Dẻo',short:'Bánh Dẻo',vi:'Trà sữa hạt sen',color:'#E8D6A8',price:35,brew:'heat',season:'trungthu'},
  {id:'bingo',name:'Bí Ngô Mèo Đen',short:'Bí Ngô',vi:'Trà sữa bí đỏ',color:'#F08A3C',price:35,brew:'whisk',season:'halloween'},
  {id:'gung',name:'Trà sữa Gừng Quế',short:'Gừng Quế',vi:'Trà sữa gừng quế',color:'#C98B5A',price:35,brew:'steep',season:'noel'},
  {id:'mutdua',name:'Trà sữa Mứt Dừa',short:'Mứt Dừa',vi:'Trà sữa mứt dừa',color:'#F4EEDC',price:35,brew:'heat',season:'tet'},
];

export const TOPS:Topping[]=[
  {id:'pearl',name:'Trân châu',short:'Trân châu',vi:'Trân châu',price:5},
  {id:'grass',name:'Sương sáo',short:'Sương sáo',vi:'Sương sáo',price:5},
  {id:'pudding',name:'Pudding mặt mèo',short:'Pudding',vi:'Pudding',price:7,day:2},
  {id:'foam',name:'Kem tai mèo',short:'Kem mèo',vi:'Kem cheese',price:8,day:3},
  {id:'lychee',name:'Thạch chân mèo',short:'Chân mèo',vi:'Thạch vải',price:6,day:3},
];

export const SUGARS:number[]=[0,30,50,70,100];

export const QUAL:Record<Quality,QualityInfo>={perfect:{label:'Hoàn hảo',mul:1.4,cls:'q-perfect'},good:{label:'Tốt',mul:1,cls:''},weak:{label:'Nhạt',mul:.5,cls:'q-bad'},bitter:{label:'Đắng',mul:.5,cls:'q-bad'},clumpy:{label:'Vón cục',mul:.5,cls:'q-bad'}};

export const PEARL_BATCH=10;

export const ICES=['Không đá','Ít đá','Đá vừa'];

export const TYPES:Record<TypeId,CustomerType>={
  regular:{label:'Khách quen',patience:34,tip:1,pay:1,strict:false},
  rush:{label:'Đang vội',patience:22,tip:1.8,pay:1,strict:false},
  picky:{label:'Khó tính',patience:38,tip:2.2,pay:1,strict:true},
  cat:{label:'Mèo VIP',patience:42,tip:3,pay:2,strict:false},
  reviewer:{label:'Reviewer',patience:45,tip:3,pay:1,strict:true},
  online:{label:'Đơn online',patience:62,tip:1.3,pay:1.3,strict:false},
};

export const LEVELS=[0,120,340,660,1080,1600,2250];

export const TUB=12;

export const SUPPLY:SupplyItem[]=[
  {id:'black',kind:'tea',name:'Lá trà đen',desc:'1 gói pha được 1 mẻ',price:40},
  {id:'jasmine',kind:'tea',name:'Lá trà lài',desc:'1 gói pha được 1 mẻ',price:40},
  {id:'taro',kind:'tea',name:'Bột khoai môn',desc:'1 gói pha được 1 mẻ',price:50},
  {id:'matcha',kind:'tea',name:'Bột matcha',desc:'1 gói pha được 1 mẻ',price:60},
  {id:'thai',kind:'tea',name:'Trà Thái',desc:'1 gói pha được 1 mẻ',price:50},
  {id:'dao',kind:'tea',name:'Đào ngâm & sả',desc:'Món mùa hè · 1 gói pha được 1 mẻ',price:55},
  {id:'banhdeo',kind:'tea',name:'Hạt sen & bánh dẻo',desc:'Món Trung Thu · 1 gói pha được 1 mẻ',price:55},
  {id:'bingo',kind:'tea',name:'Bột bí đỏ',desc:'Món Halloween · 1 gói pha được 1 mẻ',price:55},
  {id:'gung',kind:'tea',name:'Gừng & quế',desc:'Món Giáng Sinh · 1 gói pha được 1 mẻ',price:55},
  {id:'mutdua',kind:'tea',name:'Mứt dừa',desc:'Món Tết · 1 gói pha được 1 mẻ',price:55},
  {id:'pearl',kind:'top',name:'Bao bột năng',desc:'1 bao nấu được 10 muỗng trân châu',price:25},
  {id:'grass',kind:'top',name:'Hũ sương sáo',desc:`${TUB} muỗng, để được lâu`,price:40,tub:true},
  {id:'pudding',kind:'top',name:'Hũ pudding mặt mèo',desc:`${TUB} muỗng, để được lâu`,price:55,tub:true},
  {id:'lychee',kind:'top',name:'Hũ thạch chân mèo',desc:`${TUB} muỗng, để được lâu`,price:50,tub:true},
  {id:'foam',kind:'top',name:'Hũ kem tai mèo',desc:`${TUB} muỗng, để được lâu`,price:65,tub:true},
];

export const RECIPES:ShopItem[]=[
  {id:'matcha',kind:'tea',name:'Matcha Mắt Mèo',lv:2,price:780,desc:'Món trà mới, giá 32k. Tặng kèm 1 gói.'},
  {id:'pudding',kind:'top',name:'Pudding mặt mèo',lv:2,price:570,desc:'Topping mới, +7k mỗi ly. Tặng kèm 1 hũ.'},
  {id:'thai',kind:'tea',name:'Trà Thái Mèo Cam',lv:3,price:830,desc:'Món trà mới, giá 30k. Tặng kèm 1 gói.'},
  {id:'lychee',kind:'top',name:'Thạch chân mèo',lv:4,price:620,desc:'Topping mới, +6k mỗi ly. Tặng kèm 1 hũ.'},
  {id:'foam',kind:'top',name:'Kem tai mèo',lv:5,price:990,desc:'Topping mới, +8k mỗi ly. Tặng kèm 1 hũ.'},
];

export const UPGRADES:ShopItem[]=[
  // bought at the cart or the kiosk; shown there, and the bonus stays with you after moving
  {id:'bell',name:'Chuông xe đẩy',lv:1,price:160,place:'cart',desc:'Leng keng gọi khách: khách ghé nhanh hơn 10%.'},
  {id:'parasol',name:'Dù hai lớp có tua rua',lv:1,price:220,place:'cart',desc:'Bóng mát rộng hơn: khách chờ lâu hơn 8%.'},
  {id:'paint',name:'Sơn lại xe dấu chân mèo',lv:2,price:260,place:'cart',desc:'Xe mới tinh, dễ thương hơn: tip +5%.'},
  {id:'fan',name:'Quạt trần mini',lv:2,price:320,place:'kiosk',desc:'Mát rượi dưới mái tôn: tip +5%.'},
  {id:'radio',name:'Radio cát-xét',lv:3,price:300,place:'kiosk',desc:'Nhạc vui tai kéo khách: khách ghé nhanh hơn 10%.'},
  {id:'garland',name:'Dây hoa giấy',lv:3,price:280,place:'kiosk',desc:'Treo quanh mái ki-ốt: khách chờ lâu hơn 8%.'},
  {id:'double',name:'Menu 2 topping',lv:2,price:560,desc:'Khách được gọi 2 topping, hóa đơn lớn hơn.'},
  {id:'catbed',name:'Nệm êm cho mèo',lv:3,price:420,desc:'Mèo VIP bắt đầu ghé quán và trả gấp đôi.'},
  {id:'bigpot',name:'Ấm trà lớn',lv:4,price:980,desc:'Mỗi mẻ trà được 12 ly thay vì 8.'},
  {id:'kettle',name:'Ấm siêu tốc',lv:3,price:700,desc:'Pha gấp giữa ca chỉ mất 3 giây thay vì 7.'},
  {id:'nonstick',name:'Nồi chống dính',lv:4,price:620,desc:'Trân châu dính chậm hơn 35% khi nấu.'},
  {id:'lights',name:'Thêm dây đèn',lv:5,price:1120,desc:'Khách kiên nhẫn chờ lâu hơn 20%.'},
  {id:'tipjar',name:'Hũ tip vẽ mèo',lv:6,price:840,desc:'Mọi tiền tip +25%.'},
];

export const STAFF:StaffInfo[]=[
  {id:'hoa',name:'Chị Hoa · pha chế',lv:2,price:500,wage:70,desc:'Để ý các order đang chờ: pha trà, nấu trân châu trước khi hết (2 nồi cùng lúc). Kho cạn thì tự đặt giao gấp.'},
  {id:'tu',name:'Anh Tú · chạy bàn',lv:3,price:730,wage:90,desc:'Ly nào khớp order là Tú dán nắp và mang ra ngay. Trò chuyện giúp khách chờ lâu hơn 15%.'},
  {id:'na',name:'Bé Na · phụ quầy',lv:4,price:900,wage:110,desc:'Ly trống là Na tự rót trà, đường và đá cho order đang chọn (1 giây). Bạn chỉ cần thêm topping.'},
];

export const DELIVERY=15,RUSH:[number,number]=[55,85];

export const FEATURES:Record<string,number>={seal:2,rush:2,minis:2,multi:3,online:3};

export const NEWS:Record<number,[string,string][]>={
  2:[['Dán nắp ly','Từ hôm nay mỗi ly đều được dán nắp khi phục vụ, tốn 1 màng dán. Nhớ mua đủ màng ở chợ.'],['Giờ cao điểm','Giữa ca có 30 giây khách đến đông gấp đôi.'],['Trân châu 2 bước','Từ hôm nay trân châu phải nhào bột và vo viên rồi mới nấu.']],
  3:[['Khách mua nhiều ly','Có khách gọi 2 ly: pha ly đầu, cho vào túi, rồi bấm “Pha y chang”. Đủ ly thì túi tự đóng và giao.'],['Đơn online','Shipper MèoShip đặt 2 đến 3 ly, trả nhiều hơn 30% nhưng phải đóng túi.']],
};

export const MINI_INFO:Record<string,{label:string;text:(name:string)=>string}>={
  steep:{label:'Nhấc túi trà',text:n=>`Ủ ${n}: nhấc túi trà khi kim nằm trong vùng xanh.`},
  heat:{label:'Giữ để đun',text:n=>`Đun nước pha ${n}: giữ nút để đun, thả ra cho nguội. Giữ nhiệt trong vùng xanh đủ lâu.`},
  whisk:{label:'Đánh!',text:n=>`Đánh ${n}: vuốt qua lại trên hình (hoặc bấm liên tục, phím ← →) cho bọt đầy trước khi hết giờ.`},
  stir:{label:'Khuấy',text:()=>'Nấu trân châu: bấm Khuấy để hạt không dính vào nhau, đừng để thanh chạm vùng đỏ.'},
  knead:{label:'Nhào!',text:()=>'Bước 1/2 · Nhào bột và vo viên: bấm Nhào đúng lúc vòng tròn khép vào viên bột. 5 nhịp.'},
};

SUPPLY.push(
  {id:'cup',kind:'gear',gear:true,name:'Ly nhựa tai mèo',desc:'Thùng 50 ly',price:30,pack:50},
  {id:'straw',kind:'gear',gear:true,name:'Ống hút',desc:'Bó 100 ống',price:15,pack:100},
  {id:'film',kind:'gear',gear:true,name:'Màng dán nắp',desc:'Cuộn 80 miếng',price:20,pack:80},
  {id:'bag',kind:'gear',gear:true,name:'Túi giấy mặt mèo',desc:'Xấp 20 túi',price:15,pack:20});

export const GEAR=['cup','straw','film','bag'],GEAR_NAME:Record<string,string>={cup:'ly',straw:'ống hút',film:'màng dán',bag:'túi giấy'};

// ---- daily events: rolled once per in-game day (from day 3), change traffic, patience, tips and prices
export const EVENTS:Record<string,GameEvent>={
  normal:{name:'Ngày bình thường',desc:'',spawn:1,pat:1,tip:1,online:1,price:1,w:5},
  rain:{name:'Trời mưa',desc:'Ít khách ghé hơn nhưng ai tới cũng kiên nhẫn, tip +30% và đơn online nhiều gấp đôi.',spawn:.78,pat:1.2,tip:1.3,online:2,price:1,w:2},
  holiday:{name:'Ngày lễ',desc:'Phố đông nghẹt: khách nhiều hơn 35%, giá bán +10%, nhưng ai cũng vội hơn.',spawn:1.35,pat:.9,tip:1,online:1,price:1.1,w:1.5},
  hot:{name:'Nắng nóng',desc:'Trời oi bức: khách nhiều hơn 20%, tip +10% và hầu như ai cũng gọi đá.',spawn:1.2,pat:1,tip:1.1,online:1,price:1,w:1.5,iceHeavy:true},
  review:{name:'Reviewer ghé tiệm',desc:'Một reviewer nổi tiếng (đeo kính râm) sẽ ghé giữa ca. Pha hoàn hảo cho họ để nhận thưởng lớn.',spawn:1,pat:1,tip:1,online:1,price:1,w:1},
};
// ---- seasons follow the real calendar
export const SEASONS:Record<string,Season>={
  he:{name:'Mùa hè',desc:'Nắng vàng, dây cờ dưa hấu. Món mùa: Trà Đào Cam Sả. Tip +5%.',tip:1.05},
  trungthu:{name:'Mùa Trung Thu',desc:'Tiệm treo đèn lồng, đèn ông sao. Món mùa: Trà sữa Bánh Dẻo. Tip +10%.',tip:1.1},
  halloween:{name:'Halloween',desc:'Bí ngô, dơi nhỏ và mạng nhện. Món mùa: Bí Ngô Mèo Đen. Tip +10%.',tip:1.1},
  noel:{name:'Giáng Sinh',desc:'Tuyết rơi, vòng nguyệt quế và mũ ông già Noel cho bé Bơ. Món mùa: Trà sữa Gừng Quế. Tip +10%.',tip:1.1},
  tet:{name:'Tết',desc:'Hoa mai, lồng đèn đỏ và bao lì xì. Món mùa: Trà sữa Mứt Dừa. Tip +20%.',tip:1.2},
};

// ---- regulars: named customers with a favourite drink; perfect drinks raise friendship (0-5 hearts)
export const REGULARS:Regular[]=[
  {id:'lan',name:'Cô Lan',fav:{tea:'taro',sugar:50,ice:1,tops:['pearl']},look:{skin:'#F3CDAA',hair:'#2A1E1A',style:'bun',shirt:'#B79BD6'},bio:'Cô giáo tiểu học, ghé sau giờ dạy và kể chuyện học trò cho mèo Bơ nghe.',gift:'Cô Lan tặng tiệm một hộp bánh nướng tự làm.'},
  {id:'minh',name:'Anh Minh',fav:{tea:'black',sugar:70,ice:2,tops:['pearl']},look:{skin:'#E2AD83',hair:'#2A1E1A',style:'short',shirt:'#6FA8E8',glasses:true},bio:'Lập trình viên. Bảo rằng một ly trà sữa sửa được mọi lỗi code.',gift:'Anh Minh làm giúp tiệm một trang đặt hàng online.'},
  {id:'hung',name:'Chú Hùng',fav:{tea:'black',sugar:0,ice:0,tops:[]},look:{skin:'#C68863',hair:'#4A2E22',style:'cap',cap:'#5C8F5A',shirt:'#E4D3B0'},bio:'Chạy xe ôm ở đầu hẻm. Luôn gọi không đường, không đá, không topping.',gift:'Chú Hùng giới thiệu cả nhóm xe ôm tới uống.'},
  {id:'vy',name:'Vy',fav:{tea:'jasmine',sugar:30,ice:1,tops:['grass']},look:{skin:'#F3CDAA',hair:'#7A4A2A',style:'bob',shirt:'#F58DA6'},bio:'Sinh viên mỹ thuật, vẽ tranh mấy bé mèo của tiệm vào sổ ký họa.',gift:'Vy tặng tiệm bức tranh vẽ Bơ, Mochi và Mun.'},
  {id:'bach',name:'Ông Bạch',fav:{tea:'jasmine',sugar:0,ice:0,tops:[]},look:{skin:'#E2AD83',hair:'#D8D0C8',style:'short',shirt:'#7A8FA8',glasses:true},bio:'Về hưu, ngày nào cũng ngồi vuốt mèo Mochi đúng 15 phút.',gift:'Ông Bạch đan tặng mèo Mochi một chiếc khăn len.'},
  {id:'mai',name:'Chị Mai',fav:{tea:'matcha',sugar:50,ice:1,tops:['pudding']},look:{skin:'#F3CDAA',hair:'#3B2F5A',style:'long',shirt:'#8FBF6A'},bio:'Nhiếp ảnh gia, đăng ảnh tiệm lên mạng và được cả nghìn lượt thích.',gift:'Bài đăng của chị Mai làm tiệm nổi tiếng hơn.'},
  {id:'khoa',name:'Khoa',fav:{tea:'thai',sugar:100,ice:2,tops:['pearl']},look:{skin:'#C68863',hair:'#2A1E1A',style:'spiky',shirt:'#E8894A'},bio:'Vận động viên bóng rổ, hảo ngọt và luôn gọi 100% đường.',gift:'Khoa mang cả đội bóng tới ủng hộ.'},
  {id:'ngoc',name:'Ngọc',fav:{tea:'taro',sugar:70,ice:1,tops:['lychee']},look:{skin:'#F6D5B8',hair:'#9E4A3A',style:'long',shirt:'#F2A541'},bio:'Streamer, hay livestream cảnh pha chế và mèo Mun đi dạo.',gift:'Buổi livestream của Ngọc có hàng nghìn người xem.'},
];

// ---- shop decorations: bought once, shown in the street scene. Each point of coziness = +1% tips
// and +0.5% customer patience (see cozyBonus in src/logic/economy.ts).
export const DECOR:DecorItem[]=[
  {id:'plant',name:'Chậu trầu bà',lv:1,price:150,cozy:2,desc:'Đặt cạnh hũ tip, lá rủ xuống mép quầy.'},
  {id:'bunting',name:'Dây cờ pastel',lv:1,price:220,cozy:3,desc:'Một hàng cờ tam giác màu kẹo dưới dây đèn.'},
  {id:'chime',name:'Chuông gió vỏ sò',lv:2,price:180,cozy:2,desc:'Treo dưới mái hiên, thỉnh thoảng kêu leng keng.'},
  {id:'cookies',name:'Hũ bánh quy cá',lv:2,price:200,cozy:2,desc:'Bánh quy hình cá trên quầy. Bé Bơ cứ nhìn chằm chằm.'},
  {id:'board',name:'Bảng menu phấn màu',lv:3,price:280,cozy:3,desc:'Vẽ lại bảng menu bằng phấn màu, có hình mèo ở góc.'},
  {id:'flowers',name:'Hộp hoa trước quầy',lv:3,price:260,cozy:3,desc:'Một hộp hoa nhỏ treo trước mặt quầy.'},
  {id:'sign',name:'Bảng hiệu gỗ',lv:4,price:340,cozy:4,desc:'Bảng hiệu treo giữa mái hiên: mặt mèo, trái tim và ly trà sữa.'},
  {id:'lantern',name:'Đèn lồng tai mèo',lv:4,price:380,cozy:4,desc:'Đèn giấy hình đầu mèo, sáng ấm ở góc tiệm.'},
  // only from achievements
  {id:'trophy',name:'Cúp trà sữa vàng',lv:1,price:0,cozy:5,exclusive:true,desc:'Phần thưởng thành tích “Năm trăm ly”. Đặt trên quầy.'},
  {id:'neon',name:'Biển neon mèo',lv:1,price:0,cozy:5,exclusive:true,desc:'Phần thưởng thành tích “Bậc thầy trà sữa”. Sáng hồng dưới mái hiên.'},
  {id:'cushion',name:'Gối nhung cho bé Bơ',lv:1,price:0,cozy:5,exclusive:true,desc:'Phần thưởng thành tích “Tiệm của riêng mình”. Bơ ngủ ngon hơn hẳn.'},
];

// ---- places: a new game starts with the pushcart; moving up costs savings and needs a level.
// slots = customers served at once; goal = share of the daily revenue target.
export const PLACES:PlaceInfo[]=[
  {id:'cart',name:'Xe đẩy trà sữa',lv:1,price:0,slots:2,goal:.6,pay:1,desc:'Chiếc xe đẩy nhỏ ở đầu hẻm, dù hồng che nắng.',
    perks:['2 khách một lúc','Trà sữa Mèo Mun, Trà lài Mèo Vàng, trân châu']},
  {id:'kiosk',name:'Ki-ốt góc chợ',lv:2,price:2000,slots:3,goal:.85,pay:1.1,desc:'Một quầy có mái che ở góc chợ.',
    perks:['Khách trả thêm 10% mỗi ly','3 khách một lúc','Thêm Khoai môn Mèo Tím và sương sáo','Học được công thức món mới']},
  {id:'shop',name:'Tiệm Mèo Trân Châu',lv:4,price:6000,slots:3,goal:1,pay:1.25,desc:'Một tiệm thật sự có mái hiên sọc hồng.',
    perks:['Khách trả thêm 25% mỗi ly','Thuê nhân viên','Trang trí tiệm','Nhận đơn online MèoShip','Bé Mochi về nằm trên mái hiên']},
];
/** the first place where each thing becomes available */
export const NEEDS_PLACE:Record<string,PlaceId>={recipe:'kiosk',staff:'shop',decor:'shop',online:'shop',catbed:'shop'};

// ---- visiting cats: one may stroll by during a shift; tap it to befriend it. Each one in the album = +1 coziness.
export const VISITORS:VisitorCat[]=[
  {id:'muop',name:'Mướp',place:'cart',fur:'#C9A15A',dark:'#8A6A3A',eye:'#7ED6B8',bio:'Mèo mướp đầu hẻm, cứ nghe mùi trân châu là tới.'},
  {id:'sua',name:'Sữa',place:'cart',fur:'#FFF8EE',dark:'#E8D8C4',eye:'#6FA8E8',bio:'Trắng như ly sữa tươi, thích nằm trong bóng dù.'},
  {id:'khoi',name:'Khói',place:'kiosk',fur:'#9A94A8',dark:'#6E6880',eye:'#F2C94C',bio:'Mèo xám ở chợ, đi nhẹ như khói, hay ngủ trên thùng ly.'},
  {id:'tamthe',name:'Tam Thể',place:'kiosk',fur:'#FFF4EA',dark:'#3B2A2D',patch:'#F2A541',eye:'#7ED6B8',bio:'Ba màu may mắn, ghé đâu là chỗ đó đông khách.'},
  {id:'bong',name:'Bông',place:'shop',fur:'#F7D6DE',dark:'#E0A8B8',eye:'#B79BD6',bio:'Lông xù như kẹo bông, thích ngồi cạnh hũ bánh quy.'},
  {id:'socola',name:'Sô-cô-la',place:'shop',fur:'#7A4A2A',dark:'#4A2E1A',eye:'#F2C94C',bio:'Nâu bóng, hay đòi uống “một ly không đường”.'},
  {id:'hoangtu',name:'Hoàng Tử',place:'cart',fur:'#F4AA55',dark:'#E08A34',eye:'#7ED6B8',streak:true,bio:'Đội vương miện nhỏ. Chỉ ghé ai chăm chỉ mở tiệm 7 ngày liền.'},
];

// ---- daily gift for coming back on consecutive real days (a 7-day cycle)
export const DAILY_GIFTS=[
  {label:'+60k',money:60},
  {label:'1 gói mỗi loại trà',teas:1},
  {label:'+100k',money:100},
  {label:'2 bao bột năng',pantry:{pearl:2}},
  {label:'+150k',money:150},
  {label:'Bộ ly, ống hút, màng dán, túi',pantry:{cup:30,straw:30,film:30,bag:5}},
  {label:'+300k và bé mèo Hoàng Tử',money:300,cat:'hoangtu'},
] as {label:string;money?:number;teas?:number;pantry?:Record<string,number>;cat?:string}[];
