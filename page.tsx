import { getJobs, getFilterOptions } from '@/lib/airtable'
import JobTable from '@/components/JobTable'
import Filters from '@/components/Filters'
import Header from '@/components/Header'

export const revalidate = 300 // Revalidate every 5 minutes

interface PageProps {
  searchParams: {
    function?: string
    location?: string
    investor?: string
    remote?: string
    search?: string
  }
}

export default async function Home({ searchParams }: PageProps) {
  const [jobs, filterOptions] = await Promise.all([
    getJobs({
      function: searchParams.function,
      location: searchParams.location,
      remoteOnly: searchParams.remote === 'true',
      search: searchParams.search,
    }),
    getFilterOptions(),
  ])

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tagline */}
        <p className="text-cadre-gray text-lg mb-8">
          The career graph for tech talent. Find jobs at 250+ venture-backed companies.
        </p>

        {/* Filters */}
        <Filters 
          options={filterOptions}
          currentFilters={searchParams}
        />

        {/* Job Count */}
        <div className="mt-8 mb-4">
          <p className="text-sm text-gray-500">
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
          </p>
        </div>

        {/* Job Listings Table */}
        <JobTable jobs={jobs} />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            Updated daily. Data sourced from company career pages.
          </p>
        </footer>
      </div>
    </main>
  )
}
