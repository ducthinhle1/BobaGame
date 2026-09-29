// Mèo Trân Châu — static game data: menu, prices, customer types, levels, shop items, staff.
// Tune the game here; src/main.js holds the game logic.

export const TEAS=[
  {id:'black',name:'Trà sữa Mèo Mun',short:'Mèo Mun',vi:'Trà đen sữa',color:'#C08A5B',price:25},
  {id:'jasmine',name:'Trà lài Mèo Vàng',short:'Mèo Vàng',vi:'Trà lài sữa',color:'#D6CB7E',price:25},
  {id:'taro',name:'Khoai môn Mèo Tím',short:'Mèo Tím',vi:'Khoai môn sữa',color:'#B79BD6',price:30},
  {id:'matcha',name:'Matcha Mắt Mèo',short:'Mắt Mèo',vi:'Matcha sữa',color:'#8FBF6A',price:32,day:2},
  {id:'thai',name:'Trà Thái Mèo Cam',short:'Mèo Cam',vi:'Trà Thái sữa',color:'#E8894A',price:30,day:3},
];

export const TOPS=[
  {id:'pearl',name:'Trân châu',short:'Trân châu',vi:'Trân châu',price:5},
  {id:'grass',name:'Sương sáo',short:'Sương sáo',vi:'Sương sáo',price:5},
  {id:'pudding',name:'Pudding mặt mèo',short:'Pudding',vi:'Pudding',price:7,day:2},
  {id:'foam',name:'Kem tai mèo',short:'Kem mèo',vi:'Kem cheese',price:8,day:3},
  {id:'lychee',name:'Thạch chân mèo',short:'Chân mèo',vi:'Thạch vải',price:6,day:3},
];

export const SUGARS=[0,30,50,70,100];

export const QUAL={perfect:{label:'Hoàn hảo',mul:1.4,cls:'q-perfect'},good:{label:'Tốt',mul:1,cls:''},weak:{label:'Nhạt',mul:.5,cls:'q-bad'},bitter:{label:'Đắng',mul:.5,cls:'q-bad'},clumpy:{label:'Vón cục',mul:.5,cls:'q-bad'}};

export const PEARL_BATCH=10;

export const ICES=['Không đá','Ít đá','Đá vừa'];

export const TYPES={
  regular:{label:'Khách quen',patience:34,tip:1,pay:1,strict:false},
  rush:{label:'Đang vội',patience:22,tip:1.8,pay:1,strict:false},
  picky:{label:'Khó tính',patience:38,tip:2.2,pay:1,strict:true},
  cat:{label:'Mèo VIP',patience:42,tip:3,pay:2,strict:false},
  online:{label:'Đơn online',patience:62,tip:1.3,pay:1.3,strict:false},
};

export const LEVELS=[0,120,340,660,1080,1600,2250];

export const TUB=12;

export const SUPPLY=[
  {id:'black',kind:'tea',name:'Lá trà đen',desc:'1 gói pha được 1 mẻ',price:40},
  {id:'jasmine',kind:'tea',name:'Lá trà lài',desc:'1 gói pha được 1 mẻ',price:40},
  {id:'taro',kind:'tea',name:'Bột khoai môn',desc:'1 gói pha được 1 mẻ',price:50},
  {id:'matcha',kind:'tea',name:'Bột matcha',desc:'1 gói pha được 1 mẻ',price:60},
  {id:'thai',kind:'tea',name:'Trà Thái',desc:'1 gói pha được 1 mẻ',price:50},
  {id:'pearl',kind:'top',name:'Bao bột năng',desc:'1 bao nấu được 10 muỗng trân châu',price:25},
  {id:'grass',kind:'top',name:'Hũ sương sáo',desc:`${TUB} muỗng, để được lâu`,price:40,tub:true},
  {id:'pudding',kind:'top',name:'Hũ pudding mặt mèo',desc:`${TUB} muỗng, để được lâu`,price:55,tub:true},
  {id:'lychee',kind:'top',name:'Hũ thạch chân mèo',desc:`${TUB} muỗng, để được lâu`,price:50,tub:true},
  {id:'foam',kind:'top',name:'Hũ kem tai mèo',desc:`${TUB} muỗng, để được lâu`,price:65,tub:true},
];

export const RECIPES=[
  {id:'matcha',kind:'tea',name:'Matcha Mắt Mèo',lv:2,price:780,desc:'Món trà mới, giá 32k. Tặng kèm 1 gói.'},
  {id:'pudding',kind:'top',name:'Pudding mặt mèo',lv:2,price:570,desc:'Topping mới, +7k mỗi ly. Tặng kèm 1 hũ.'},
  {id:'thai',kind:'tea',name:'Trà Thái Mèo Cam',lv:3,price:830,desc:'Món trà mới, giá 30k. Tặng kèm 1 gói.'},
  {id:'lychee',kind:'top',name:'Thạch chân mèo',lv:4,price:620,desc:'Topping mới, +6k mỗi ly. Tặng kèm 1 hũ.'},
  {id:'foam',kind:'top',name:'Kem tai mèo',lv:5,price:990,desc:'Topping mới, +8k mỗi ly. Tặng kèm 1 hũ.'},
];

export const UPGRADES=[
  {id:'double',name:'Menu 2 topping',lv:2,price:560,desc:'Khách được gọi 2 topping, hóa đơn lớn hơn.'},
  {id:'catbed',name:'Nệm êm cho mèo',lv:3,price:420,desc:'Mèo VIP bắt đầu ghé quán và trả gấp đôi.'},
  {id:'bigpot',name:'Ấm trà lớn',lv:4,price:980,desc:'Mỗi mẻ trà được 12 ly thay vì 8.'},
  {id:'kettle',name:'Ấm siêu tốc',lv:3,price:700,desc:'Pha gấp giữa ca chỉ mất 3 giây thay vì 7.'},
  {id:'nonstick',name:'Nồi chống dính',lv:4,price:620,desc:'Trân châu dính chậm hơn 35% khi nấu.'},
  {id:'lights',name:'Thêm dây đèn',lv:5,price:1120,desc:'Khách kiên nhẫn chờ lâu hơn 20%.'},
  {id:'tipjar',name:'Hũ tip vẽ mèo',lv:6,price:840,desc:'Mọi tiền tip +25%.'},
];

export const STAFF=[
  {id:'hoa',name:'Chị Hoa · pha chế',lv:2,price:500,wage:70,desc:'Tự pha thêm trà và nấu trân châu khi sắp hết, dùng nguyên liệu trong kho.'},
  {id:'tu',name:'Anh Tú · chạy bàn',lv:3,price:730,wage:90,desc:'Ly nào khớp phiếu là Tú mang ra ngay. Trò chuyện giúp khách chờ lâu hơn 15%.'},
  {id:'na',name:'Bé Na · phụ quầy',lv:4,price:900,wage:110,desc:'Bấm “Nhờ Na” trên phiếu: Na rót sẵn trà, đường và đá. Nghỉ 15 giây giữa mỗi lần.'},
];

export const DELIVERY=15,RUSH=[55,85];

export const FEATURES={seal:2,rush:2,minis:2,multi:3,online:3};

export const NEWS={
  2:[['Dán nắp ly','Từ hôm nay pha xong phải bấm Dán nắp (phím S) rồi mới phục vụ được.'],['Giờ cao điểm','Giữa ca có 30 giây khách đến đông gấp đôi.'],['Mini game mới','Lúc chuẩn bị sẽ có thêm kiểu đun nước và đánh bọt, trân châu phải nhào bột rồi mới nấu.']],
  3:[['Khách mua nhiều ly','Phiếu có nhãn ×2: pha từng ly, cho vào túi, đủ ly thì bấm Đóng túi & giao.'],['Đơn online','Shipper MèoShip đặt 2 đến 3 ly, trả nhiều hơn 30% nhưng phải đóng túi.']],
};

export const MINI_INFO={
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

export const GEAR=['cup','straw','film','bag'],GEAR_NAME={cup:'ly',straw:'ống hút',film:'màng dán',bag:'túi giấy'};
