export interface Company {
    name: string;
    sector: string;
    location: string;
    phone?: string;
    mainProduct?: string;
}

export interface Job {
    company: string;
    title: string;
    link: string;
    deadline: string;
    sector: string;
    source: 'saramin' | 'jobkorea' | 'jumpit' | 'wanted';
}

export interface MatchedJob extends Job {
    isDesignated: boolean;
    designatedCompanyInfo?: Company;
}
