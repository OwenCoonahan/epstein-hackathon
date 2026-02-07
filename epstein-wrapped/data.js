/**
 * EPSTEIN WRAPPED 2025 - Data Sources
 * 
 * All data is from publicly available sources:
 * - Court documents (PACER, CourtListener)
 * - FOIA-released flight logs
 * - Journalistic investigations (Miami Herald, NY Times)
 * - Property records
 */

const DATA_SOURCES = {
    flightLogs: {
        description: "Flight logs from Epstein's aircraft",
        sources: [
            {
                name: "Gawker Flight Log Release (2015)",
                url: "https://gawker.com/flight-logs-put-clinton-dershowitz-on-pedophile-billionaires-sex-jet-1681039971",
                date: "2015-01-22"
            },
            {
                name: "Court Document 1032 - Giuffre v. Maxwell",
                url: "https://www.courtlistener.com/docket/4355835/giuffre-v-maxwell/",
                date: "2019"
            }
        ],
        notes: "Logs cover partial period 1997-2005. Not all flights were logged."
    },
    
    blackBook: {
        description: "Epstein's personal contact book",
        sources: [
            {
                name: "Gawker Black Book Release",
                url: "https://gawker.com/here-is-pedophile-billionaire-jeffrey-epsteins-little-b-1681383992",
                date: "2015-01-21"
            }
        ],
        notes: "221 pages, approximately 1,971 names. Presence in book does not imply wrongdoing."
    },
    
    properties: {
        description: "Epstein's real estate holdings",
        sources: [
            {
                name: "USVI Property Records",
                type: "Government Records"
            },
            {
                name: "New York City Property Records",
                type: "Government Records"
            },
            {
                name: "New York Times Investigation",
                url: "https://www.nytimes.com/2019/07/31/business/jeffrey-epstein-wealth.html"
            }
        ],
        data: {
            littleStJames: {
                acquired: 1998,
                price: "$8,000,000",
                size: "71.5 acres",
                location: "U.S. Virgin Islands"
            },
            greatStJames: {
                acquired: 2016,
                price: "$22,500,000",
                size: "165 acres",
                location: "U.S. Virgin Islands"
            },
            manhattan: {
                address: "9 East 71st Street",
                acquired: 1989,
                source: "Les Wexner",
                estimatedValue: "$56,000,000"
            },
            palmBeach: {
                address: "358 El Brillo Way",
                size: "14,000 sq ft"
            },
            newMexico: {
                name: "Zorro Ranch",
                size: "7,500 acres",
                location: "Stanley, NM"
            },
            paris: {
                address: "22 Avenue Foch",
                description: "Apartment in 16th arrondissement"
            }
        }
    },
    
    finances: {
        description: "Financial information from court filings and investigations",
        sources: [
            {
                name: "Probate Court Filings (2019)",
                location: "U.S. Virgin Islands"
            },
            {
                name: "NY Times Wealth Investigation",
                url: "https://www.nytimes.com/2019/07/31/business/jeffrey-epstein-wealth.html"
            }
        ],
        data: {
            netWorth: {
                value: "$577,672,654",
                source: "Estate probate filing",
                date: "2019"
            },
            wexnerConnection: {
                description: "Power of attorney over Wexner finances",
                townhouseGift: "$46,000,000+",
                relationship: "Financial advisor 1987-2007"
            }
        },
        notes: "Source of wealth remains disputed. No clear record of legitimate financial work."
    },
    
    legalTimeline: {
        events: [
            {
                year: 2005,
                month: "March",
                event: "Palm Beach police begin investigation",
                details: "Parent reports abuse of 14-year-old daughter"
            },
            {
                year: 2006,
                month: "May",
                event: "FBI opens investigation",
                details: "Palm Beach refers case to FBI"
            },
            {
                year: 2007,
                month: "September",
                event: "Non-prosecution agreement drafted",
                details: "Secret deal with U.S. Attorney Alexander Acosta"
            },
            {
                year: 2008,
                month: "June",
                event: "Pleads guilty to state charges",
                details: "Solicitation of prostitution (avoiding federal charges)"
            },
            {
                year: 2008,
                month: "July",
                event: "Sentenced to 18 months",
                details: "Served 13 months with work release"
            },
            {
                year: 2019,
                month: "July 6",
                event: "Arrested by FBI",
                details: "SDNY charges: sex trafficking of minors"
            },
            {
                year: 2019,
                month: "July 23",
                event: "Found injured in cell",
                details: "Reported suicide attempt or assault"
            },
            {
                year: 2019,
                month: "August 10",
                event: "Found dead",
                details: "Ruled suicide by hanging, disputed by family"
            }
        ]
    },
    
    deathCircumstances: {
        description: "Circumstances surrounding death at MCC",
        facts: [
            {
                item: "Camera footage",
                status: "Two cameras outside cell malfunctioned",
                source: "DOJ Inspector General"
            },
            {
                item: "Guards",
                status: "Both guards asleep, falsified records",
                source: "Criminal charges filed"
            },
            {
                item: "Suicide watch",
                status: "Removed 6 days before death",
                source: "Bureau of Prisons records"
            },
            {
                item: "Cellmate",
                status: "Transferred out hours before death",
                source: "BOP records"
            },
            {
                item: "Autopsy",
                status: "Ruled suicide; private autopsy disputed findings",
                source: "NYC Medical Examiner, Dr. Michael Baden"
            }
        ],
        notes: "Family hired Dr. Michael Baden who disputed suicide ruling"
    },
    
    associates: {
        description: "Frequent flyers from released flight logs",
        data: [
            {
                name: "Ghislaine Maxwell",
                flights: 352,
                role: "Alleged co-conspirator",
                outcome: "Convicted 2021, sentenced to 20 years"
            },
            {
                name: "Sarah Kellen",
                flights: 181,
                role: "Executive assistant",
                outcome: "Named as potential co-conspirator, never charged"
            },
            {
                name: "Nadia Marcinkova",
                flights: 127,
                role: "Listed as 'pilot' in some logs",
                outcome: "Named in victim testimony"
            },
            {
                name: "Emmy Tayler",
                flights: 87,
                role: "Assistant",
                outcome: "Named in documents"
            }
        ],
        celebrityAppearances: [
            {
                name: "Bill Clinton",
                flights: "26+",
                notes: "Documented in flight logs, Secret Service sometimes present"
            },
            {
                name: "Prince Andrew",
                visits: "Multiple",
                notes: "Photographed at properties, subject of civil suit (settled)"
            },
            {
                name: "Alan Dershowitz",
                flights: "Multiple",
                notes: "Named in court documents, disputes allegations"
            }
        ],
        disclaimer: "Presence on flights or in contact book does not imply knowledge of crimes"
    },
    
    victims: {
        description: "Victim statistics from court proceedings",
        data: {
            identified: "~200",
            source: "Victim compensation fund and court proceedings",
            ageRange: "As young as 14",
            compensationFund: {
                claims: "225+",
                distributed: "$121,000,000+"
            }
        },
        resources: [
            {
                name: "RAINN",
                url: "https://www.rainn.org",
                description: "National Sexual Assault Hotline: 1-800-656-4673"
            }
        ]
    }
};

// Export for use in app if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DATA_SOURCES;
}
