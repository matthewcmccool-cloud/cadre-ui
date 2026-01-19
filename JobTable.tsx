import Link from 'next/link'
import { Job } from '@/lib/airtable'

interface JobTableProps {
  jobs: Job[]
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

function formatLocation(location: string, remoteFirst: boolean): string {
  if (remoteFirst && location) {
    return `${location} • Remote`
  }
  if (remoteFirst) {
    return 'Remote'
  }
  return location || 'Not specified'
}

export default function JobTable({ jobs }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No jobs found matching your filters.</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="job-table">
        <thead>
          <tr>
            <th className="w-28">Date</th>
            <th>Job Title</th>
            <th className="w-40">Company</th>
            <th className="w-48">Investors</th>
            <th className="w-44">Location</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              {/* Date */}
              <td data-label="Date" className="text-sm text-gray-500 whitespace-nowrap">
                {formatDate(job.datePosted)}
              </td>
              
              {/* Job Title */}
              <td data-label="Title">
                <Link 
                  href={job.applyUrl || job.jobUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cadre-black hover:underline"
                >
                  {job.title}
                </Link>
                {job.function && (
                  <span className="ml-2 text-xs text-gray-400">
                    {job.function}
                  </span>
                )}
              </td>
              
              {/* Company */}
              <td data-label="Company">
                <span className="dynamic-link cursor-pointer">
                  {job.company}
                </span>
              </td>
              
              {/* Investors */}
              <td data-label="Investors">
                {job.investors && job.investors.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {job.investors.slice(0, 3).map((investor, i) => (
                      <span key={i} className="dynamic-link cursor-pointer text-sm">
                        {investor}
                        {i < Math.min(job.investors.length - 1, 2) && ','}
                      </span>
                    ))}
                    {job.investors.length > 3 && (
                      <span className="text-sm text-gray-400">
                        +{job.investors.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-300 text-sm">—</span>
                )}
              </td>
              
              {/* Location */}
              <td data-label="Location" className="text-sm">
                <span className={job.remoteFirst ? 'text-cadre-gray' : 'text-gray-600'}>
                  {formatLocation(job.location, job.remoteFirst)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
