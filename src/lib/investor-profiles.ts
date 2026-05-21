export type InvestorProfileMeta = {
  firm: string;
  website: string;
  bio: string;
};

/** Long-form profile copy for investor detail pages */
export const INVESTOR_PROFILES: Record<string, InvestorProfileMeta> = {
  "peter-schiff": {
    firm: "Euro Pacific Asset Management",
    website: "www.europacificfunds.com",
    bio: "Chief Economist of Euro Pacific Asset Management and one of the most prominent gold proponents in the world. Widely recognized for accurately forecasting the 2008 housing collapse, Schiff has been a fierce and consistent critic of Federal Reserve monetary policy for decades. He has a famously critical view of Bitcoin and the broader technology sector, arguing that neither represents real wealth. Schiff is projecting significant long-term upside for physical precious metals and gold equities as global debt continues to expand.",
  },
  "eric-sprott": {
    firm: "Sprott Inc. / Personal Portfolio",
    website: "www.sprottinc.com",
    bio: "Billionaire investor and founder of Sprott Inc., Eric Sprott is widely regarded as the godfather of junior gold and silver mining. Over his career he has backed more than 100 small mining companies through direct private placements, often providing critical early-stage financing that larger institutions ignore. Sprott has a unique ability to identify high-grade discovery plays before the broader market and has earned a cult-like following in the junior resource community. His personal portfolio is almost entirely concentrated in early-stage gold and silver explorers in Canada's prolific mining districts.",
  },
  "sprott-asset-management-funds": {
    firm: "Sprott Asset Management LP",
    website: "www.sprott.com",
    bio: "Sprott Asset Management is the world's leading alternative asset manager focused exclusively on precious metals and real assets, with over $25 billion in assets under management. The firm manages a comprehensive suite of products including physical gold and silver trusts, uranium funds, and actively managed precious metals equity funds. Sprott's ETFs and closed-end funds are the benchmark for institutional precious metals exposure globally. Founded by Eric Sprott and now publicly listed as Sprott Inc. (SII), the firm has built an unrivalled reputation for deep sector expertise and alignment with hard-money investors.",
  },
  "ross-beaty": {
    firm: "Pan American Silver / Equinox Gold",
    website: "www.panamericansilver.com",
    bio: "Ross Beaty is one of Canada's most celebrated serial mining entrepreneurs, having founded Pan American Silver in 1994 and co-founded Equinox Gold in 2017. He has built and monetized over a dozen resource companies throughout his career, consistently creating outsized shareholder value. Beaty is renowned for his deep expertise in Latin American mining operations and for his disciplined approach to capital allocation, never overpaying for assets. Beyond mining, he is a major environmental philanthropist, dedicating substantial resources to conservation in British Columbia and globally.",
  },
  "frank-giustra": {
    firm: "Fiore Group",
    website: "www.giustra.com",
    bio: "Frank Giustra is one of the most influential deal-makers in the history of the gold mining industry, best known for architecting the creation of Wheaton River Minerals, which ultimately became Goldcorp — one of the largest gold producers in the world. He combines an unmatched network of global political and financial relationships with creative deal-structuring skills that have launched numerous resource companies. Beyond mining, Giustra is deeply involved in film through Lionsgate Entertainment and runs the Giustra Foundation, a major international humanitarian organization. He is a vocal advocate for a global monetary reset with gold playing a central role.",
  },
  "rick-rule": {
    firm: "Rule Investment Media LLC",
    website: "www.ruleinvestmentmedia.com",
    bio: "Rick Rule is one of the most experienced and respected natural resource investors in the world, with over 50 years of experience in resource securities beginning in 1974. He is the former President and CEO of Sprott US Holdings and founder of Global Resource Investments, and is known for his value-oriented, contrarian approach to junior mining. Rule is famous for maintaining large cash reserves until high-conviction 'fat pitch' opportunities emerge, and he applies rigorous fundamental analysis to every position he takes. He has mentored an entire generation of resource investors through his education platform at RuleClassroom.com and his annual natural resource symposium.",
  },
  "john-hathaway": {
    firm: "Sprott Asset Management (Hathaway Gold Strategy)",
    website: "www.sprott.com",
    bio: "John Hathaway is one of the most respected gold equity fund managers of his generation, with a career spanning the Tocqueville Gold Fund — one of the longest-running and best-performing gold funds in history — and now the Sprott Hathaway Special Situations Strategy. He applies a rigorous quality-first framework, prioritizing large-cap producers and royalty companies with strong balance sheets and Tier-1 jurisdictions. Hathaway is a frequent commentator on monetary policy, currency debasement, and gold's role as a reserve asset, and his research is widely read by institutional investors. His disciplined approach has consistently generated alpha versus gold bullion over full market cycles.",
  },
  "ned-naylor-leyland": {
    firm: "Jupiter Asset Management",
    website: "www.jupiteram.com",
    bio: "Ned Naylor-Leyland is Head of Gold & Silver at Jupiter Asset Management in London, where he manages the Jupiter Gold & Silver Fund — one of the few funds in the world that holds both physical bullion and mining equities. His core philosophy is that gold and silver are monetary assets, not commodities, and he is particularly focused on silver's historical monetary undervaluation relative to gold. Naylor-Leyland dynamically shifts the fund between physical metal and equities based on where he sees the best risk-adjusted return across the cycle. He is one of the most articulate voices in Europe on the structural case for monetary metals as central bank credibility erodes.",
  },
  "pierre-lassonde": {
    firm: "Franco-Nevada Corporation",
    website: "www.franco-nevada.com",
    bio: "Pierre Lassonde is a Canadian business legend who co-invented the gold royalty model when he co-founded the original Franco-Nevada Corporation with Seymour Schulich in 1982. That company, sold to Newmont in 2002 for $3.2 billion, generated a 36% annualized return from inception — one of the greatest investment records in mining history. Lassonde revived the Franco-Nevada brand in 2008, building it into the world's premier gold royalty company with a market capitalization exceeding $20 billion. He is a Member of the Order of Canada and a major philanthropist, with significant donations to arts and education institutions across Quebec.",
  },
  "doug-casey": {
    firm: "Casey Research",
    website: "www.caseyresearch.com",
    bio: "Doug Casey is an anarcho-capitalist speculator, bestselling author, and founder of Casey Research, one of the most influential precious metals and resource investment research services in the world. His 1979 book 'Crisis Investing' became the best-selling financial book of its time, and his subsequent 'International Speculator' newsletter built a decades-long track record of identifying early-stage junior mining opportunities. Casey is an uncompromising believer in physical gold and silver coins as the only true form of money, and is deeply skeptical of the long-term viability of fiat monetary systems. He splits his time between Argentina, Uruguay, and various international locations consistent with his internationalist philosophy.",
  },
  "marin-katusa": {
    firm: "Katusa Research",
    website: "www.katusaresearch.com",
    bio: "Marin Katusa is a Canadian resource investor, bestselling author of 'The Colder War,' and founder of Katusa Research, known for his innovative co-investment model in which newsletter subscribers invest alongside him in the same private placements and deals. He began his career as a mathematician before transitioning to resource investing, bringing a quantitative discipline to sector analysis that differentiates him from most newsletter writers. Katusa has made a high-conviction pivot into uranium as a structural investment theme alongside his gold and silver positions, and has backed numerous junior mining companies across North and South America. His deal flow and access to management teams gives subscribers rare insight into pre-public financing rounds.",
  },
  "nolan-watson": {
    firm: "Sandstorm Gold Royalties",
    website: "www.sandstormgold.com",
    bio: "Nolan Watson is the co-founder and CEO of Sandstorm Gold Royalties, one of the fastest-growing gold royalty companies in the world, which he built from scratch after his tenure as CFO of Silver Wheaton (now Wheaton Precious Metals). Watson pioneered innovative royalty deal structures that gave mining companies access to capital during the tight financing environment following the 2008 financial crisis. Sandstorm's royalty and streaming book now covers more than 40 producing assets across multiple jurisdictions, providing diversified exposure to gold and silver prices. Watson is also the founder of Helios Investment Partners, a faith-based philanthropic investment firm focused on economic development in sub-Saharan Africa.",
  },
  "lukas-lundin": {
    firm: "Lundin Group of Companies",
    website: "www.lundin.ch",
    bio: "Lukas Lundin is the Chairman of the Lundin Group, one of the most powerful and successful mining dynasties in the world, with a portfolio of companies spanning gold, copper, zinc, nickel, and uranium across multiple continents. His flagship achievement is Lundin Gold's Fruta del Norte mine in Ecuador — one of the highest-grade gold mines ever put into production — which has exceeded all expectations since its 2019 commissioning. The Lundin Group is renowned for its willingness to operate in difficult jurisdictions where others won't go, consistently generating exceptional returns for shareholders who trust the family's operational track record. Lukas continues the legacy of his late father Adolf Lundin by taking bold, concentrated positions in assets that can become mine-defining discoveries.",
  },
  "thomas-kaplan": {
    firm: "The Electrum Group",
    website: "www.electrumgroup.com",
    bio: "Thomas Kaplan is a billionaire investor, art collector, and conservationist who made his first fortune in oil and gas before making a high-conviction pivot into gold, believing it to be the ultimate store of value in a world of expanding sovereign debt. He founded The Electrum Group to manage his precious metals investment portfolio, with a particular focus on Alaska's world-class gold endowment through his flagship investment in NovaGold Resources and its Donlin Gold project. Beyond investing, Kaplan is one of the world's foremost collectors of Dutch and Flemish Old Master paintings and a major supporter of tiger conservation through Panthera. He has consistently argued that gold's role in the monetary system is being systematically underappreciated by mainstream investors.",
  },
  "grant-williams": {
    firm: "Grant Williams SEZC / TTMYGH",
    website: "www.grant-williams.com",
    bio: "Grant Williams is a globally respected macro analyst, financial author, and former portfolio manager best known for his long-running newsletter 'Things That Make You Go Hmmm...' (TTMYGH), which has been read by some of the world's most prominent investors and fund managers. He was a co-founder of Real Vision, the financial media platform that democratized access to long-form investment content, and he hosts The Grant Williams Podcast featuring in-depth conversations with leading macro thinkers. Williams holds a deep conviction that the current fiat monetary system is in its terminal phase, and that gold and silver will reassert their historical role as monetary anchors as trust in sovereign currencies erodes. His portfolio reflects this thesis through a significant allocation to physical metals and high-quality royalty companies.",
  },
  "mark-bristow": {
    firm: "Barrick Gold Corporation",
    website: "www.barrick.com",
    bio: "Mark Bristow is the President and CEO of Barrick Gold, the world's second-largest gold mining company, and is widely regarded as the most operationally capable CEO in the gold industry. A geologist by training who built Randgold Resources into one of the best-performing mining stocks of its era, Bristow engineered the landmark 2019 merger of Randgold and Barrick, creating a combined company with Tier-1 assets across Africa and the Americas. He is known for his hands-on management style, his willingness to operate in challenging African jurisdictions, and his insistence that mining companies earn and maintain their social license to operate. Bristow has a deep personal conviction that gold remains the world's most important monetary asset and maintains significant insider ownership in Barrick.",
  },
  "david-garofalo": {
    firm: "Gold Royalties Corp",
    website: "www.goldroyalties.com",
    bio: "David Garofalo is a veteran gold industry executive who served as CEO of Goldcorp before leading its $18 billion merger with Newmont in 2019, and is now Chairman and CEO of Gold Royalty Corp, which he founded to build a diversified royalty platform targeting discovery-stage and development assets. He has spent over 25 years at the executive level in the gold mining industry, with deep experience in corporate finance, mergers and acquisitions, and mine development across Canada, Mexico, and Central America. Garofalo believes the royalty model is uniquely positioned to capture the upside of the current gold cycle without the operational risk of direct mine ownership. He is particularly focused on the prolific Abitibi greenstone belt in Quebec and Ontario as the core of Gold Royalty's asset pipeline.",
  },
  "keith-neumeyer": {
    firm: "First Majestic Silver Corp",
    website: "www.firstmajestic.com",
    bio: "Keith Neumeyer is the founder and CEO of First Majestic Silver, one of the world's largest pure-play silver mining companies, and is the most outspoken silver bull among major mining executives globally. He has built First Majestic from a small exploration company into a multi-mine silver producer with operations across Mexico, and his vision has always been to create a company that reflects his deep belief that silver is dramatically undervalued relative to gold and its growing industrial importance. Neumeyer is also a co-founder of First Mining Gold, which operates a 'gold bank' model of accumulating mineral resources through the cycle. He publicly holds physical silver and has been a vocal critic of what he believes is manipulation in the paper silver market.",
  },
  "bob-quartermaine": {
    firm: "Seabridge Gold Inc.",
    website: "www.seabridgegold.com",
    bio: "Bob Quartermaine is the President, CEO and co-founder of Seabridge Gold, a company he has built around a singular conviction: that accumulating gold resources per share in the ground — without producing them until prices are optimal — is the most powerful way to create wealth for patient shareholders. Seabridge's KSM project in British Columbia is one of the largest undeveloped gold-copper deposits in the world, with a resource base that has grown consistently for over two decades. Quartermaine's strategy is deliberately anti-dilutive and ultra-patient, and he has maintained this discipline through multiple cycles when the market has questioned his approach. He believes the KSM deposit will eventually attract a major mining company partner or acquirer at a valuation that will dramatically reward long-term holders.",
  },
  "tavi-costa": {
    firm: "Crescat Capital LLC",
    website: "www.crescat.net",
    bio: "Otavio 'Tavi' Costa is a Partner and Macro Strategist at Crescat Capital in Denver, where he has been responsible for developing the firm's proprietary macro models and its precious metals investment thesis since 2013. Born and raised in São Paulo, Brazil, Costa brings a first-hand understanding of what hyperinflation and currency debasement do to ordinary people's wealth, which has deeply informed his conviction in gold and silver as monetary anchors. He is one of the most active institutional investors in junior mining private placements, working alongside Crescat's CIO Kevin Smith to identify early-stage gold and silver discoveries with asymmetric return profiles. Crescat's research is widely followed on financial media and Costa's macro cycle analysis has been featured in Bloomberg, the Wall Street Journal, and Real Vision.",
  },
  "brien-lundin": {
    firm: "Jefferson Financial / Gold Newsletter",
    website: "www.goldnewsletter.com",
    bio: "Brien Lundin is the editor of Gold Newsletter, the oldest continuously published investment newsletter in the United States, founded in 1971 — and he has also served as producer of the New Orleans Investment Conference, one of the premier gatherings of gold and resource investors in the world, for over three decades. He has followed the precious metals markets through multiple full cycles, developing a broad and diversified approach to PM investing that spans physical gold, senior producers, development-stage companies, and Nevada-focused juniors. Lundin is particularly bullish on the US domestic gold mining industry and the historic Comstock and Carlin trends in Nevada. His newsletter provides both macro commentary and specific stock recommendations across the full precious metals spectrum.",
  },
  "rob-mcewen": {
    firm: "McEwen Mining Inc.",
    website: "www.mcewenmining.com",
    bio: "Rob McEwen is the founder and Chief Owner of McEwen Mining and the former founder and CEO of Goldcorp, which he built from a small mining company into one of the world's largest gold producers, famously using an open-source 'Goldcorp Challenge' in 2000 to crowdsource exploration data that helped identify billions in gold reserves. McEwen takes no salary from McEwen Mining and has invested over $200 million of his own capital alongside shareholders, making him one of the most aligned mining CEOs in the world. His primary value catalyst is McEwen Copper's Los Azules project in Argentina — one of the largest undeveloped copper-gold porphyry deposits on the planet — which he is developing as a standalone company. McEwen is a vocal advocate for gold as a long-term monetary store of value and has spoken extensively about gold's role in protecting wealth against currency debasement.",
  },
};
