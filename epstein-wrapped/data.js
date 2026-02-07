/**
 * EPSTEIN WRAPPED 2025 - Data Sources (V2 UNHINGED EDITION)
 * 
 * All data is from publicly available sources:
 * - Court documents (PACER, CourtListener)
 * - FOIA-released flight logs
 * - DOJ press releases and indictments
 * - Journalistic investigations (Miami Herald, NY Times)
 * - Wikipedia (compiled from court documents)
 * - Property records
 * 
 * SOURCES CITED INLINE
 */

const DATA_SOURCES = {
    // ============================================
    // DARK STATS - THE UNCOMFORTABLE STUFF
    // ============================================
    victimStats: {
        description: "Victim statistics from court proceedings and investigations",
        sources: [
            { name: "Wikipedia - Jeffrey Epstein", url: "https://en.wikipedia.org/wiki/Jeffrey_Epstein" },
            { name: "Miami Herald Investigation (Julie K. Brown)", url: "https://www.miamiherald.com/topics/jeffrey-epstein" },
            { name: "DOJ SDNY Indictment", date: "2019-07-08" },
            { name: "Palm Beach Police Affidavits", date: "2006" }
        ],
        data: {
            totalVictims: "1,000+", // Wikipedia infobox, from victim fund claims
            identifiedByMiamiHerald: 80, // Julie K. Brown's investigation
            confirmedMinorsFBI: 36, // Initial FBI "Operation Leap Year"
            confirmedMinorsNPA: 40, // Non-prosecution agreement final count
            youngestDocumented: 14, // From Palm Beach investigation
            youngestAlleged: 12, // Triplets allegation from France
            averageAgeEstimate: "14-16", // Most victims in this range per court docs
            recruitmentPyramid: true, // Victims recruited other victims
            internationalRecruitment: ["France", "Brazil", "Former Soviet countries", "Eastern Europe"],
            // Anonymized "frequent flyer" victims from court docs
            frequentVictims: [
                { id: "Jane Doe 1", note: "Filed civil suit, received settlement" },
                { id: "Jane Doe 2", note: "Named in Maxwell trial" },
                { id: "Jane Doe 3", note: "Virginia Giuffre (went public 2011)" }
            ]
        },
        compensationFund: {
            claims: "225+",
            distributed: "$121,000,000+",
            averagePerVictim: "$537,000"
        }
    },

    recruitmentStats: {
        description: "How victims were recruited",
        sources: [
            { name: "Palm Beach Police Investigation", date: "2005-2006" },
            { name: "Maxwell Trial Testimony", date: "2021" }
        ],
        data: {
            method: "Pyramid scheme style - victims paid $200-300 to recruit friends",
            locations: [
                "Palm Beach area high schools",
                "Shopping malls",
                "Jean-Luc Brunel's MC2 Modeling Agency",
                "Victoria's Secret (Epstein posed as talent scout)"
            ],
            initialPayment: "$200-300 for 'massage'",
            recruitmentBonus: "$200 per new girl brought",
            palmBeachPoliceQuote: "This was 50-something 'shes' and one 'he'—and the 'shes' all basically told the same story."
        }
    },

    // ============================================
    // PERSONAL PREFERENCES & PURCHASES
    // ============================================
    personalPreferences: {
        sources: [
            { name: "Palm Beach Police Search - Amazon Receipt", date: "2005" },
            { name: "Court depositions" },
            { name: "Wikipedia biography" }
        ],
        books: {
            documented: "Sadomasochism books (Amazon receipt found in search)",
            note: "Court records document Amazon receipt for S&M literature"
        },
        music: {
            talent: "Played piano since age 5",
            training: "Attended Interlochen Center for the Arts (1967)",
            note: "Regarded as talented musician by friends"
        },
        education: {
            prodigy: "Skipped two grades, graduated high school at 16",
            subjects: "Math and physics"
        },
        massages: {
            frequency: "Three times per day",
            source: "Former employee testimony to police"
        }
    },

    purchases: {
        description: "Known major purchases",
        sources: [
            { name: "Property records" },
            { name: "Court filings" },
            { name: "NYT Investigation", url: "https://www.nytimes.com/2019/07/31/business/jeffrey-epstein-wealth.html" }
        ],
        realEstate: {
            littleStJames: {
                name: "Little St. James Island",
                nickname: "Pedophile Island",
                acquired: 1998,
                price: "$8,000,000",
                size: "71.5 acres",
                location: "U.S. Virgin Islands"
            },
            greatStJames: {
                name: "Great St. James Island",
                acquired: 2016,
                price: "$22,500,000",
                size: "165 acres",
                location: "U.S. Virgin Islands"
            },
            manhattan: {
                name: "Herbert N. Straus House",
                address: "9 East 71st Street",
                acquired: 1989,
                source: "Gift from Les Wexner",
                estimatedValue: "$56,000,000",
                note: "Largest private residence in Manhattan"
            },
            palmBeach: {
                address: "358 El Brillo Way",
                size: "14,000 sq ft",
                features: "Hidden cameras found during 2005 search"
            },
            newMexico: {
                name: "Zorro Ranch",
                size: "7,500 acres",
                location: "Stanley, NM",
                note: "Allegedly planned to 'seed human race' here"
            },
            paris: {
                address: "22 Avenue Foch",
                description: "Apartment in 16th arrondissement"
            }
        },
        aircraft: [
            { model: "Boeing 727-31", tail: "N908JE", nickname: "Lolita Express" },
            { model: "Gulfstream II", tail: "N120JE" }
        ],
        surveillance: {
            description: "Extensive video surveillance throughout properties",
            features: [
                "Hidden cameras in bedrooms and bathrooms",
                "Media room with live monitoring",
                "DVDs labeled 'young [name] + [name]' found in safe"
            ],
            source: "DOJ, Maria Farmer testimony"
        }
    },

    // ============================================
    // FLIGHT LOGS
    // ============================================
    flightLogs: {
        description: "Flight logs from Epstein's aircraft",
        sources: [
            { name: "Gawker Flight Log Release", url: "https://gawker.com/flight-logs-put-clinton-dershowitz-on-pedophile-billionaires-sex-jet-1681039971", date: "2015-01-22" },
            { name: "Court Document 1032 - Giuffre v. Maxwell", date: "2019" }
        ],
        stats: {
            totalFlights: 1036,
            dateRange: "1997-2005",
            note: "Logs cover partial period. Not all flights were logged."
        }
    },
    
    // ============================================
    // ASSOCIATES WITH PHOTOS
    // ============================================
    associates: {
        description: "Key associates from flight logs and court documents",
        sources: [
            { name: "Flight logs" },
            { name: "Court documents" },
            { name: "Maxwell trial" }
        ],
        frequentFlyers: [
            {
                name: "Ghislaine Maxwell",
                flights: 352,
                role: "Alleged co-conspirator, girlfriend, recruiter",
                outcome: "Convicted 2021, sentenced to 20 years",
                photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ghislaine_Maxwell_%28cropped%29.jpg/440px-Ghislaine_Maxwell_%28cropped%29.jpg"
            },
            {
                name: "Sarah Kellen",
                flights: 181,
                role: "Executive assistant, 'scheduler'",
                outcome: "Named as potential co-conspirator, never charged",
                photo: null
            },
            {
                name: "Nadia Marcinkova",
                flights: 127,
                role: "Listed as 'pilot' in some logs",
                outcome: "Named in victim testimony",
                photo: null
            },
            {
                name: "Emmy Tayler",
                flights: 87,
                role: "Assistant",
                outcome: "Named in documents",
                photo: null
            }
        ],
        celebrities: [
            {
                name: "Bill Clinton",
                detail: "26+ documented flights",
                notes: "Secret Service sometimes present",
                photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Bill_Clinton.jpg/440px-Bill_Clinton.jpg"
            },
            {
                name: "Donald Trump",
                detail: "Longtime friend, fell out ~2004",
                notes: "Called Epstein 'terrific guy' in 2002",
                quote: "He likes beautiful women as much as I do, and many of them are on the younger side.",
                photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/440px-Donald_Trump_official_portrait.jpg"
            },
            {
                name: "Prince Andrew",
                detail: "Multiple visits, photographed",
                notes: "Settled civil suit with Virginia Giuffre for £12M",
                photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Prince_Andrew_August_2014_%28cropped%29.jpg/440px-Prince_Andrew_August_2014_%28cropped%29.jpg"
            },
            {
                name: "Alan Dershowitz",
                detail: "Named in court documents",
                notes: "Accused by Virginia Giuffre, denies allegations",
                photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Alan_Dershowitz_2009.jpg/440px-Alan_Dershowitz_2009.jpg"
            },
            {
                name: "Bill Gates",
                detail: "Met multiple times after 2011 conviction",
                notes: "Gates Foundation connection, Melinda cited as divorce factor",
                photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Bill_Gates_2017_%28cropped%29.jpg/440px-Bill_Gates_2017_%28cropped%29.jpg"
            },
            {
                name: "Kevin Spacey",
                detail: "2002 Africa trip with Clinton",
                notes: "On Epstein's plane",
                photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Kevin_Spacey%2C_May_2013.jpg/440px-Kevin_Spacey%2C_May_2013.jpg"
            },
            {
                name: "Les Wexner",
                detail: "Only known billionaire client",
                notes: "Gave Epstein $46M+ townhouse, power of attorney",
                photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Les_Wexner.jpg/440px-Les_Wexner.jpg"
            }
        ],
        disclaimer: "Presence on flights or in contact book does not imply knowledge of crimes"
    },

    // ============================================
    // FINANCES
    // ============================================
    finances: {
        description: "Financial information from court filings and investigations",
        sources: [
            { name: "Probate Court Filings", location: "U.S. Virgin Islands", date: "2019" },
            { name: "Forbes Investigation", date: "2025" },
            { name: "Senator Ron Wyden Treasury Report" }
        ],
        data: {
            netWorth: "$577,672,654",
            revenueEpsteinCompanies: "$800,000,000+ (1999-2018)",
            wexnerFees: "$200,000,000",
            leonBlackFees: "$170,000,000",
            wireTransfers: "$1.9 billion (across 4 banks)",
            taxRate: "4% effective (vs 38.5% top marginal)",
            taxesSaved: "$300,000,000",
            mysterySources: "Unknown - nobody really knows what he did"
        }
    },

    // ============================================
    // THE "SUICIDE"
    // ============================================
    death: {
        description: "Circumstances surrounding death at MCC",
        date: "August 10, 2019",
        location: "Metropolitan Correctional Center, New York",
        officialCause: "Suicide by hanging",
        sources: [
            { name: "DOJ Inspector General" },
            { name: "NYC Medical Examiner" },
            { name: "Dr. Michael Baden (private autopsy)" }
        ],
        suspiciousFactors: [
            { item: "Camera footage", status: "Two cameras outside cell 'malfunctioned'" },
            { item: "Guards", status: "Both guards asleep, later charged with falsifying records" },
            { item: "Suicide watch", status: "Removed 6 days before death" },
            { item: "Cellmate", status: "Transferred out hours before death" },
            { item: "Neck bones", status: "Hyoid bone broken (more common in strangulation than hanging)" },
            { item: "2025 CCTV release", status: "2 minutes 53 seconds missing, video found to be modified despite FBI claims of 'raw' footage" }
        ],
        familyDispute: "Family hired Dr. Michael Baden who disputed suicide ruling"
    },

    // ============================================
    // BLACK BOOK
    // ============================================
    blackBook: {
        description: "Epstein's personal contact book",
        sources: [
            { name: "Gawker Black Book Release", url: "https://gawker.com/here-is-pedophile-billionaire-jeffrey-epsteins-little-b-1681383992", date: "2015-01-21" }
        ],
        stats: {
            names: 1971,
            pages: 221
        },
        notes: "Presence in book does not imply wrongdoing"
    },

    // ============================================
    // LEGAL TIMELINE
    // ============================================
    legalTimeline: {
        events: [
            { year: 2005, month: "March", event: "Investigation begins", details: "Parent reports abuse of 14-year-old daughter" },
            { year: 2006, month: "July", event: "FBI 'Operation Leap Year' begins" },
            { year: 2007, month: "September", event: "Secret non-prosecution agreement" },
            { year: 2008, month: "June", event: "Pleads guilty to state charges" },
            { year: 2008, month: "July", event: "13 months 'jail' with work release", details: "Left jail 12 hours/day, 6 days/week" },
            { year: 2019, month: "July 6", event: "Arrested by FBI (SDNY)" },
            { year: 2019, month: "August 10", event: "'Suicide'" }
        ]
    },

    // ============================================
    // THE MEME
    // ============================================
    memeStats: {
        personalityTraits: [
            "Didn't kill himself",
            "Liked them young",
            "Great at networking",
            "Tax optimization expert",
            "Island enthusiast"
        ],
        wrappedAura: "Blackmail Energy ✨",
        topGenre: "True Crime (as the subject)",
        listeningSince: "Before it was cool to care"
    }
};

// Export for use in app if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DATA_SOURCES;
}
