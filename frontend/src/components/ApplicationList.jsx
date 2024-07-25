import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Modal,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ArrowForward';

const ApplicationList = ({ applicantId, applicantProfileId }) => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(10);
  const [applicantProfiles, setApplicantProfiles] = useState({});
  const [expandedApplicantId, setExpandedApplicantId] = useState(null);
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    fetchJobs();
  }, [currentPage]);

  const fetchJobs = async () => {
    try {
      const userId = localStorage.getItem('userid');
      const orgResponse = await axios.get(
        `http://localhost:8000/api/v1/org/create/?created_by=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      const organizations = orgResponse.data.results;
      if (!organizations || organizations.length === 0) {
        console.error('No organization found for user or empty response:', orgResponse);
        return;
      }
      const organizationId = organizations[0].id;
      const jobsResponse = await axios.get(
        `http://localhost:8000/api/v1/job/?company=${organizationId}&page=${currentPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      const jobsData = jobsResponse.data.results;
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      const applicationsResponse = await axios.get(
        `http://localhost:8000/api/v1/application/?job=${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      console.log('Applications Response:', applicationsResponse);

      if (applicationsResponse.data && applicationsResponse.data.data && Array.isArray(applicationsResponse.data.data)) {
        setApplicants(applicationsResponse.data.data);

        // Fetch applicant profiles for each applicant
        const profiles = {};
        for (const application of applicationsResponse.data.data) {
          const profileResponse = await axios.get(
            `http://localhost:8000/api/v1/applicantprofile/?applicant=${application.applicant}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
              },
            }
          );

          if (profileResponse.data && profileResponse.data.data) {
            profiles[application.applicant] = profileResponse.data.data;
            console.log(`Profile Response for applicant ${application.applicant}:, profileResponse`);
          } else {
            console.warn(`Profile not found for applicant ${application.applicant}`);
          }
        }
        setApplicantProfiles(profiles);
      } else {
        console.error('Invalid or unexpected applications response structure:', applicationsResponse);
        setApplicants([]);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
      setApplicants([]);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleExpandClick = (jobId) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJobId(null);
    setApplicants([]);
    setApplicantProfiles({});
  };

  const handleShowApplications = (jobId) => {
    setSelectedJobId(jobId);
    fetchApplicants(jobId);
    setIsModalOpen(true);
  };

  const handleShortlistApplicant = async (applicantId, jobId) => {
    try {
      const response = await axios.patch(
        'http://localhost:8000/api/v1/application/',
        {}, // Empty body as no request body is needed, parameters are passed via params
        {
          params: {
            applicant: applicantId,
            job: jobId, // Pass job ID as a parameter
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      console.log('Applicant shortlisted successfully:', response.data);
      alert("Applicant shortlisted successfully");
      // Optionally update local state or perform other actions upon success
    } catch (error) {
      console.error('Error shortlisting applicant:', error);
      // Handle error scenarios
    }
  };
  
  
  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleExpandDetails = (applicationId) => {
    setExpandedApplicantId(expandedApplicantId === applicationId ? null : applicationId);
  };

  return (
    <div style={{ padding: '20px', background: '#ffffff', borderRadius: '20px' }}>
      <TextField
        label="Search by Role"
        variant="outlined"
        fullWidth
        value={search}
        onChange={handleSearchChange}
        style={{ marginBottom: '20px' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
        {currentJobs.map((job) => (
          <Card
            key={job.id}
            style={{
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <CardContent style={{ flexGrow: 1 }}>
              <div className="bg-blue-800 text-white text-center py-4" style={{ borderRadius: '15px' }}>
                <h2 className="text-2xl font-semibold">{job.title}</h2>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-x-4 overflow-y-auto max-h-96">
                <div className="mb-4">
                  <span className="block text-gray-700 font-bold">Location:</span>
                  <span className="block text-gray-900 overflow-hidden">{job.location}</span>
                </div>
                <div className="mb-4">
                  <span className="block text-gray-700 font-bold">Work Location:</span>
                  <span className="block text-gray-900 overflow-hidden">{job.work_location}</span>
                </div>
                <div className="mb-4">
                  <span className="block text-gray-700 font-bold">Job Type:</span>
                  <span className="block text-gray-900 overflow-hidden">{job.job_type}</span>
                </div>
                <div className="mb-4">
                  <span className="block text-gray-700 font-bold">Stipend/Salary:</span>
                  <span className="block text-gray-900 overflow-hidden">{job.stipend_salary}</span>
                </div>
                <div className="mb-4">
                  <span className="block text-gray-700 font-bold">Deadline:</span>
                  <span className="block text-gray-900 overflow-hidden">{job.deadline}</span>
                </div>
                <div className="mb-4">
                  <span className="block text-gray-700 font-bold">Openings:</span>
                  <span className="block text-gray-900 overflow-hidden">{job.openings}</span>
                </div>
                <div className="mb-4">
                  <span className="block text-gray-700 font-bold">Status:</span>
                  <span className="block text-gray-900 overflow-hidden">{job.status}</span>
                </div>
              </div>
              {expandedJobId === job.id && (
                <div className="px-4 py-3">
                  <div className="mb-4">
                    <span className="block text-gray-700 font-bold">Description:</span>
                    <span className="block text-gray-900 overflow-hidden">{job.description}</span>
                  </div>
                  <div className="mb-4">
                    <span className="block text-gray-700 font-bold">Eligibility Criteria:</span>
                    <span className="block text-gray-900 overflow-hidden">{job.eligibility_criteria}</span>
                  </div>
                  <div className="mb-4">
                    <span className="block text-gray-700 font-bold">Perks & Benefits:</span>
                    <span className="block text-gray-900 overflow-hidden">{job.perks_benefits}</span>
                  </div>
                  <div className="mb-4">
                    <span className="block text-gray-700 font-bold">Custom Questions:</span>
                    <span className="block text-gray-900 overflow-hidden">{job.custom_questions}</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleShowApplications(job.id)}
                style={{
                  backgroundColor: '#1976d2',
                  color: '#ffffff',
                  borderRadius: '20px',
                }}
              >
                Show Applicants
              </Button>
              <IconButton
                onClick={() => handleExpandClick(job.id)}
                aria-expanded={expandedJobId === job.id}
                aria-label="show more"
                style={{ marginLeft: 'auto' }}
              >
                <ExpandMoreIcon
                  style={{
                    transform: expandedJobId === job.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              </IconButton>
            </CardActions>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        {Array.from({ length: Math.ceil(filteredJobs.length / jobsPerPage) }).map((_, index) => (
          <Button
            key={index}
            onClick={() => paginate(index + 1)}
            style={{
              backgroundColor: currentPage === index + 1 ? '#1976d2' : '#f0f0f0',
              color: currentPage === index + 1 ? '#ffffff' : '#000000',
              fontWeight: 'bold',
              margin: '0 5px',
              borderRadius: '5px',
            }}
          >
            {index + 1}
          </Button>
        ))}
      </div>
      <Modal
      open={isModalOpen}
      onClose={handleCloseModal}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        maxWidth: '800px',
        maxHeight: '80%',
        overflowY: 'auto',
        background: '#ffffff',
        padding: '20px',
        borderRadius: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      }}>
        <Typography id="modal-modal-title" variant="h5" className="text-center mb-4">
          Applicants for Job ID: {selectedJobId}
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {applicants.map(application => {
            const profile = applicantProfiles[application.applicant];

            if (!profile) {
              return (
                <Card key={application.id} className="mb-4 p-2" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', borderRadius: '15px' }}>
                  <CardContent>
                    <Typography variant="subtitle1" className="font-bold">
                      Profile not found for Applicant ID: {application.applicant}
                    </Typography>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={application.id} className="mb-4 p-2" style={{ position: 'relative', zIndex: 1, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', borderRadius: '15px' }}>
                <CardContent>
                  <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>
                    {application.applicant}
                  </Typography>
                  <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>
                    {profile.applicant.email}
                  </Typography>
                  <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>
                    Name:
                  </Typography>
                  <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>
                    {profile.applicant.name}
                  </Typography>
                  <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>
                    Phone Number:
                  </Typography>
                  <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>
                    {profile.applicant.phone_number}
                  </Typography>
                  <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>
                    Highest Qualification:
                  </Typography>
                  <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>
                    {profile.highest_qualification}
                  </Typography>
                  <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>
                    Stream:
                  </Typography>
                  <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>
                    {profile.stream}
                  </Typography>
                  <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>
                    Skills:
                  </Typography>
                  <div className="flex flex-wrap gap-1" style={{ zIndex: 1 }}>
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="bg-gray-200 px-2 py-1 rounded">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3" style={{ zIndex: 1 }}>
                    <IconButton
                      aria-label="expand-details"
                      onClick={() => handleExpandDetails(application.id)}
                      style={{ marginBottom: expandedApplicantId === application.id ? '10px' : 0 }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </div>
                  {expandedApplicantId === application.id && (
                    <div className="mt-3" style={{ position: 'relative', zIndex: 2 }}>
                      <Typography variant="subtitle1" className="font-bold">
                        Year:
                      </Typography>
                      <Typography variant="body1" className="text-gray-500">
                        {profile.year}
                      </Typography>
                      <Typography variant="subtitle1" className="font-bold">
                        Education Status:
                      </Typography>
                      <Typography variant="body1" className="text-gray-500">
                        {profile.education_status}
                      </Typography>
                      <Typography variant="subtitle1" className="font-bold">
                        Passing Year:
                      </Typography>
                      <Typography variant="body1" className="text-gray-500">
                        {profile.passing_year}
                      </Typography>
                      <Typography variant="subtitle1" className="font-bold">
                        CGPA:
                      </Typography>
                      <Typography variant="body1" className="text-gray-500">
                        {profile.cgpa}
                      </Typography>
                      <Typography variant="subtitle1" className="font-bold">
                        Address:
                      </Typography>
                      <Typography variant="body1" className="text-gray-500">
                        {profile.address}
                      </Typography>
                      <Typography variant="subtitle1" className="font-bold">
                        City:
                      </Typography>
                      <Typography variant="body1" className="text-gray-500">
                        {profile.city}
                      </Typography>
                      <Typography variant="subtitle1" className="font-bold">
                        State:
                      </Typography>
                      <Typography variant="body1" className="text-gray-500">
                        {profile.state}
                      </Typography>
                      <Typography variant="subtitle1" className="font-bold">
                        Pincode:
                      </Typography>
                      <Typography variant="body1" className="text-gray-500">
                        {profile.pincode}
                      </Typography>
                    </div>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleShortlistApplicant(application.applicant, selectedJobId)}
                    style={{ marginTop: '10px', zIndex: 2 }}
                  >
                    Shortlist
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Modal>
    </div> 

  ); 
}; 
export default ApplicationList;




// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import {
//   TextField,
//   Button,
//   Card,
//   CardContent,
//   CardActions,
//   IconButton,
//   Modal,
//   Typography
// } from '@mui/material';
// import { ArrowBack, ExpandMore } from '@mui/icons-material';
// import ExpandMoreIcon from '@mui/icons-material/ArrowForward';

// const ApplicationList = ({ applicantId, applicantProfileId }) => {
//   const [jobs, setJobs] = useState([]);
//   const [search, setSearch] = useState('');
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedJobId, setSelectedJobId] = useState(null);
//   const [expandedJobId, setExpandedJobId] = useState(null);
//   const [applicants, setApplicants] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [jobsPerPage] = useState(10);
//   const [applicantProfiles, setApplicantProfiles] = useState({});
//   const [expandedApplicantId, setExpandedApplicantId] = useState(null);

//   useEffect(() => {
//     fetchJobs();
//   }, [currentPage]);

//   const fetchJobs = async () => {
//     try {
//       const userId = localStorage.getItem('userid');
//       const orgResponse = await axios.get(`http://localhost:8000/api/v1/org/create/?created_by=${userId}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//         },
//       });
//       const organizations = orgResponse.data.results;
//       if (!organizations || organizations.length === 0) {
//         console.error('No organization found for user or empty response:', orgResponse);
//         return;
//       }
//       const organizationId = organizations[0].id;
//       const jobsResponse = await axios.get(`http://localhost:8000/api/v1/job/?company=${organizationId}&page=${currentPage}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//         },
//       });
//       const jobsData = jobsResponse.data.results;
//       setJobs(jobsData);
//     } catch (error) {
//       console.error('Error fetching jobs:', error);
//     }
//   };

//   const fetchApplicants = async (jobId) => {
//     try {
//       const applicationsResponse = await axios.get(`http://localhost:8000/api/v1/application/?job=${jobId}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//         },
//       });

//       console.log('Applications Response:', applicationsResponse);

//       if (applicationsResponse.data && applicationsResponse.data.data && Array.isArray(applicationsResponse.data.data)) {
//         setApplicants(applicationsResponse.data.data);

//         const profiles = {};
//         for (const application of applicationsResponse.data.data) {
//           const profileResponse = await axios.get(`http://localhost:8000/api/v1/applicantprofile/?applicant=${application.applicant}`, {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//             },
//           });

//           if (profileResponse.data && profileResponse.data.data) {
//             profiles[application.applicant] = {
//               ...profileResponse.data.data,
//               answers_to_ques: application.answers_to_ques // Add answers_to_ques to the profile
//             };
//             console.log(`Profile Response for applicant ${application.applicant}:`, profileResponse);
//           } else {
//             console.warn(`Profile not found for applicant ${application.applicant}`);
//           }
//         }
//         setApplicantProfiles(profiles);
//       } else {
//         console.error('Invalid or unexpected applications response structure:', applicationsResponse);
//         setApplicants([]);
//       }
//     } catch (error) {
//       console.error('Error fetching applicants:', error);
//       setApplicants([]);
//     }
//   };

//   const handleSearchChange = (event) => {
//     setSearch(event.target.value);
//   };

//   const handleExpandClick = (jobId) => {
//     setExpandedJobId(expandedJobId === jobId ? null : jobId);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setSelectedJobId(null);
//     setApplicants([]);
//     setApplicantProfiles({});
//   };

//   const handleShowApplications = (jobId) => {
//     setSelectedJobId(jobId);
//     fetchApplicants(jobId);
//     setIsModalOpen(true);
//   };

//   const handleShortlistApplicant = async (applicationId, currentStage) => {
//     try {
//       await axios.patch(`http://localhost:8000/api/v1/application/${applicationId}/`, {
//         stage: currentStage + 1,
//         status: 'Shortlisted',
//       }, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//         },
//       });
//       fetchApplicants(selectedJobId);
//     } catch (error) {
//       console.error('Error shortlisting applicant:', error);
//     }
//   };

//   const filteredJobs = jobs.filter(job =>
//     job.title.toLowerCase().includes(search.toLowerCase())
//   );

//   const indexOfLastJob = currentPage * jobsPerPage;
//   const indexOfFirstJob = indexOfLastJob - jobsPerPage;
//   const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

//   const paginate = pageNumber => setCurrentPage(pageNumber);

//   const handleExpandDetails = (applicationId) => {
//     setExpandedApplicantId(expandedApplicantId === applicationId ? null : applicationId);
//   };

//   return (
//     <div style={{ padding: '20px', background: '#ffffff', borderRadius: '20px' }}>
//       <TextField
//         label="Search by Role"
//         variant="outlined"
//         fullWidth
//         value={search}
//         onChange={handleSearchChange}
//         style={{ marginBottom: '20px' }}
//       />

//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
//         {currentJobs.map(job => (
//           <Card key={job.id} style={{ marginBottom: '20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
//             <CardContent style={{ flexGrow: 1 }}>
//               <div className="bg-blue-800 text-white text-center py-4" style={{ borderRadius: '15px' }}>
//                 <h2 className="text-2xl font-semibold">{job.title}</h2>
//               </div>
//               <div className="px-4 py-3 grid grid-cols-2 gap-x-4 overflow-y-auto max-h-96">
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Location:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.location}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Work Location:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.work_location}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Job Type:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.job_type}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Stipend/Salary:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.stipend_salary}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Deadline:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.deadline}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Openings:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.openings}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Status:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.status}</span>
//                 </div>
//               </div>
//             </CardContent>
//             <CardActions>
//               <Button
//                 onClick={() => handleShowApplications(job.id)}
//                 variant="contained"
//                 color="primary"
//                 style={{ borderRadius: '20px' }}
//               >
//                 View Applications
//               </Button>
//               <IconButton
//                 onClick={() => handleExpandClick(job.id)}
//                 aria-expanded={expandedJobId === job.id}
//                 aria-label="show more"
//                 style={{ marginLeft: 'auto' }}
//               >
//                 <ExpandMoreIcon />
//               </IconButton>
//             </CardActions>
//           </Card>
//         ))}
//       </div>

//       <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
//         {Array.from({ length: Math.ceil(filteredJobs.length / jobsPerPage) }).map((_, index) => (
//           <Button
//             key={index}
//             onClick={() => paginate(index + 1)}
//             variant="contained"
//             color={currentPage === index + 1 ? 'primary' : 'default'}
//             style={{ margin: '0 5px', borderRadius: '50%' }}
//           >
//             {index + 1}
//           </Button>
//         ))}
//       </div>

//       <Modal
//         open={isModalOpen}
//         onClose={handleCloseModal}
//         aria-labelledby="modal-title"
//         aria-describedby="modal-description"
//       >
//         <div
//           style={{
//             position: 'absolute',
//             top: '50%',
//             left: '50%',
//             transform: 'translate(-50%, -50%)',
//             width: '80%',
//             backgroundColor: 'white',
//             padding: '20px',
//             boxShadow: 24,
//             borderRadius: '10px',
//             maxHeight: '90vh',
//             overflowY: 'auto',
//           }}
//         >
//           <Typography id="modal-title" variant="h6" component="h2">
//             Applications
//           </Typography>
//           <div style={{ marginTop: '20px' }}>
//             {applicants.map(application => {
//               const profile = applicantProfiles[application.applicant] || {};
//               console.log('Profile:', profile);
//               return (
//                 <Card key={application.id} style={{ marginBottom: '20px' }}>
//                   <CardContent>
//                     <Typography variant="h6">Applicant Details</Typography>
//                     <Typography variant="body1"><strong>Name:</strong> {profile.name || 'N/A'}</Typography>
//                     <Typography variant="body1"><strong>Email:</strong> {profile.email || 'N/A'}</Typography>
//                     <Typography variant="body1"><strong>Phone:</strong> {profile.phone || 'N/A'}</Typography>
//                     <Typography variant="body1"><strong>Skills:</strong> {profile.skills || 'N/A'}</Typography>
//                     <Typography variant="body1"><strong>Experience:</strong> {profile.experience || 'N/A'}</Typography>
//                     <Typography variant="body1"><strong>Answers to Questions:</strong></Typography>
//                     <ul>
//                       {Array.isArray(profile.answers_to_ques) ? profile.answers_to_ques.map((answer) => (
//                         <li key={answer.id}>{answer.name}</li>
//                       )) : 'N/A'}
//                     </ul>

//                     <IconButton
//                       onClick={() => handleExpandDetails(application.id)}
//                       aria-expanded={expandedApplicantId === application.id}
//                       aria-label="show more"
//                     >
//                       <ExpandMore />
//                     </IconButton>
//                     {expandedApplicantId === application.id && (
//                       <div>
//                         {/* Display additional details if needed */}
//                         <Typography variant="body2"><strong>More details here...</strong></Typography>
//                       </div>
//                     )}
//                   </CardContent>
//                   <CardActions>
//                     <Button
//                       onClick={() => handleShortlistApplicant(application.id, application.stage)}
//                       variant="contained"
//                       color="secondary"
//                     >
//                       Shortlist
//                     </Button>
//                   </CardActions>
//                 </Card>
//               );
//             })}
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default ApplicationList;




// #####################finalll by kanishkkk
// import React, { useState, useEffect } from 'react'; 

// import axios from 'axios'; 

// import { 

//   TextField, 

//   Button, 

//   Card, 

//   CardContent, 

//   CardActions, 

//   IconButton, 

//   Modal, 

//   Typography 

// } from '@mui/material'; 

// import { ArrowBack, ExpandMore } from '@mui/icons-material'; 

// import ExpandMoreIcon from '@mui/icons-material/ArrowForward'; 

 

// const ApplicationList = ({ applicantId, applicantProfileId }) => { 

//   const [jobs, setJobs] = useState([]); 

//   const [search, setSearch] = useState(''); 

//   const [isModalOpen, setIsModalOpen] = useState(false); 

//   const [selectedJobId, setSelectedJobId] = useState(null); 

//   const [expandedJobId, setExpandedJobId] = useState(null); 

//   const [applicants, setApplicants] = useState([]); 

//   const [currentPage, setCurrentPage] = useState(1); 

//   const [jobsPerPage] = useState(10); 

//   const [applicantProfiles, setApplicantProfiles] = useState({}); 

//   const [expandedApplicantId, setExpandedApplicantId] = useState(null); // Added state for expanded applicant details 

 

//   useEffect(() => { 

//     fetchJobs(); 

//   }, [currentPage]); 

 

//   const fetchJobs = async () => { 

//     try { 

//       const userId = localStorage.getItem('userid'); 

//       const orgResponse = await axios.get(`http://localhost:8000/api/v1/org/create/?created_by=${userId}`, { 

//         headers: { 

//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`, 

//         }, 

//       }); 

//       const organizations = orgResponse.data.results; 

//       if (!organizations || organizations.length === 0) { 

//         console.error('No organization found for user or empty response:', orgResponse); 

//         return; 

//       } 

//       const organizationId = organizations[0].id; 

//       const jobsResponse = await axios.get(`http://localhost:8000/api/v1/job/?company=${organizationId}&page=${currentPage}`, { 

//         headers: { 

//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`, 

//         }, 

//       }); 

//       const jobsData = jobsResponse.data.results; 

//       setJobs(jobsData); 

//     } catch (error) { 

//       console.error('Error fetching jobs:', error); 

//     } 

//   }; 

 

//   const fetchApplicants = async (jobId) => { 

//     try { 

//       const applicationsResponse = await axios.get(`http://localhost:8000/api/v1/application/?job=${jobId}`, { 

//         headers: { 

//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`, 

//         }, 

//       }); 

   

//       console.log('Applications Response:', applicationsResponse); 

   

//       if (applicationsResponse.data && applicationsResponse.data.data && Array.isArray(applicationsResponse.data.data)) { 

//         setApplicants(applicationsResponse.data.data); 

   

//         // Fetch applicant profiles for each applicant 

//         const profiles = {}; 

//         for (const application of applicationsResponse.data.data) { 

//           const profileResponse = await axios.get(`http://localhost:8000/api/v1/applicantprofile/?applicant=${application.applicant}`, { 

//             headers: { 

//               Authorization: `Bearer ${localStorage.getItem('accessToken')}`, 

//             }, 

//           }); 

   

//           if (profileResponse.data && profileResponse.data.data) { 

//             profiles[application.applicant] = profileResponse.data.data; 

//             console.log(`Profile Response for applicant ${application.applicant}:`, profileResponse); 

//           } else { 

//             console.warn(`Profile not found for applicant ${application.applicant}`); 

//           } 

//         } 

//         setApplicantProfiles(profiles); 

//       } else { 

//         console.error('Invalid or unexpected applications response structure:', applicationsResponse); 

//         setApplicants([]); 

//       } 

//     } catch (error) { 

//       console.error('Error fetching applicants:', error); 

//       setApplicants([]); 

//     } 

//   }; 

   

 

//   const handleSearchChange = (event) => { 

//     setSearch(event.target.value); 

//   }; 

 

//   const handleExpandClick = (jobId) => { 

//     setExpandedJobId(expandedJobId === jobId ? null : jobId); 

//   }; 

 

//   const handleCloseModal = () => { 

//     setIsModalOpen(false); 

//     setSelectedJobId(null); 

//     setApplicants([]); 

//     setApplicantProfiles({}); 

//   }; 

 

//   const handleShowApplications = (jobId) => { 

//     setSelectedJobId(jobId); 

//     fetchApplicants(jobId); 

//     setIsModalOpen(true); 

//   }; 

 

//   const handleShortlistApplicant = async (applicantId, jobId) => {
//     try {
//       const response = await axios.patch(
//         'http://localhost:8000/api/v1/application/',
//         {}, // Empty body as no request body is needed, parameters are passed via params
//         {
//           params: {
//             applicant: applicantId,
//             job: jobId, // Pass job ID as a parameter
//           },
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//           },
//         }
//       );
//       console.log('Applicant shortlisted successfully:', response.data);
//       // Optionally update local state or perform other actions upon success
//     } catch (error) {
//       console.error('Error shortlisting applicant:', error);
//       // Handle error scenarios
//     }
//   };

 

//   const filteredJobs = jobs.filter(job => 

//     job.title.toLowerCase().includes(search.toLowerCase()) 

//   ); 

 

//   // Pagination logic 

//   const indexOfLastJob = currentPage * jobsPerPage; 

//   const indexOfFirstJob = indexOfLastJob - jobsPerPage; 

//   const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob); 

 

//   // Change page 

//   const paginate = pageNumber => setCurrentPage(pageNumber); 

 

//   const handleExpandDetails = (applicationId) => { 

//     setExpandedApplicantId(expandedApplicantId === applicationId ? null : applicationId); 

//   }; 

 

//   return ( 

//     <div style={{ padding: '20px', background: '#ffffff', borderRadius: '20px' }}> 

//       <TextField 

//         label="Search by Role" 

//         variant="outlined" 

//         fullWidth 

//         value={search} 

//         onChange={handleSearchChange} 

//         style={{ marginBottom: '20px' }} 

//       /> 

 

//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}> 

//         {currentJobs.map(job => ( 

//           <Card key={job.id} style={{ marginBottom: '20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}> 

//             <CardContent style={{ flexGrow: 1 }}> 

//               <div className="bg-blue-800 text-white text-center py-4" style={{ borderRadius: '15px' }}> 

//                 <h2 className="text-2xl font-semibold">{job.title}</h2> 

//               </div> 

//               <div className="px-4 py-3 grid grid-cols-2 gap-x-4 overflow-y-auto max-h-96"> 

//                 <div className="mb-4"> 

//                   <span className="block text-gray-700 font-bold">Location:</span> 

//                   <span className="block text-gray-900 overflow-hidden">{job.location}</span> 

//                 </div> 

//                 <div className="mb-4"> 

//                   <span className="block text-gray-700 font-bold">Work Location:</span> 

//                   <span className="block text-gray-900 overflow-hidden">{job.work_location}</span> 

//                 </div> 

//                 <div className="mb-4"> 

//                   <span className="block text-gray-700 font-bold">Job Type:</span> 

//                   <span className="block text-gray-900 overflow-hidden">{job.job_type}</span> 

//                 </div> 

//                 <div className="mb-4"> 

//                   <span className="block text-gray-700 font-bold">Stipend/Salary:</span> 

//                   <span className="block text-gray-900 overflow-hidden">{job.stipend_salary}</span> 

//                 </div> 

//                 <div className="mb-4"> 

//                   <span className="block text-gray-700 font-bold">Deadline:</span> 

//                   <span className="block text-gray-900 overflow-hidden">{job.deadline}</span> 

//                 </div> 

//                 <div className="mb-4"> 

//                   <span className="block text-gray-700 font-bold">Openings:</span> 

//                   <span className="block text-gray-900 overflow-hidden">{job.openings}</span> 

//                 </div> 

//                 <div className="mb-4"> 

//                   <span className="block text-gray-700 font-bold">Status:</span> 

//                   <span className="block text-gray-900 overflow-hidden">{job.status}</span> 

//                 </div> 

//               </div> 

//               {expandedJobId === job.id && ( 

//                 <div className="px-4 py-3"> 

//                   <div className="mb-4"> 

//                     <span className="block text-gray-700 font-bold">Description:</span> 

//                     <span className="block text-gray-900 overflow-hidden">{job.description}</span> 

//                   </div> 

//                   <div className="mb-4"> 

//                     <span className="block text-gray-700 font-bold">Eligibility Criteria:</span> 

//                     <span className="block text-gray-900 overflow-hidden">{job.eligibility_criteria}</span> 

//                   </div> 

//                   <div className="mb-4"> 

//                     <span className="block text-gray-700 font-bold">Perks & Benefits:</span> 

//                     <span className="block text-gray-900 overflow-hidden">{job.perks_benefits}</span> 

//                   </div> 

//                 </div> 

//               )} 

//             </CardContent> 

//             <CardActions> 

//               <Button onClick={() => handleShowApplications(job.id)} variant="contained" color="primary" style={{ borderRadius: '20px' }}> 

//                 View Applicants 

//               </Button> 

//               <IconButton 

//                 aria-expanded={expandedJobId === job.id} 

//                 onClick={() => handleExpandClick(job.id)} 

//                 aria-label="show more" 

//               > 

//                 <ExpandMore /> 

//               </IconButton> 

//             </CardActions> 

//           </Card> 

//         ))} 

//       </div> 

 

//       {/* Pagination */} 

//       <nav style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}> 

//         <ul className="pagination"> 

//           {Array.from({ length: Math.ceil(filteredJobs.length / jobsPerPage) }, (_, i) => ( 

//             <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}> 

//               <a onClick={() => paginate(i + 1)} className="page-link"> 

//                 {i + 1} 

//               </a> 

//             </li> 

//           ))} 

//         </ul> 

//       </nav> 

 

//       <Modal 

//       open={isModalOpen} 

//       onClose={handleCloseModal} 

//       aria-labelledby="modal-modal-title" 

//       aria-describedby="modal-modal-description" 

//       style={{ 

//         display: 'flex', 

//         alignItems: 'center', 

//         justifyContent: 'center', 

//       }} 

//     > 

//       <div style={{ 

//         position: 'absolute', 

//         top: '50%', 

//         left: '50%', 

//         transform: 'translate(-50%, -50%)', 

//         width: '80%', 

//         maxWidth: '800px', 

//         maxHeight: '80%', 

//         overflowY: 'auto', 

//         background: '#ffffff', 

//         padding: '20px', 

//         borderRadius: '20px', 

//         boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', 

//       }}> 

//         <Typography id="modal-modal-title" variant="h5" className="text-center mb-4">Applicants for Job ID: {selectedJobId}</Typography> 

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4"> 

//           {applicants.map(application => { 

//             const profile = applicantProfiles[application.applicant]; 

 

//             if (!profile) { 

//               return ( 

//                 <Card key={application.id} className="mb-4 p-2" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', borderRadius: '15px' }}> 

//                   <CardContent> 

//                     <Typography variant="subtitle1" className="font-bold">Profile not found for Applicant ID: {application.applicant}</Typography> 

//                   </CardContent> 

//                 </Card> 

//               ); 

//             } 

 

//             return ( 

//               <Card key={application.id} className="mb-4 p-2" style={{ position: 'relative', zIndex: 1, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', borderRadius: '15px' }}> 

//                 <CardContent> 

//                   <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>{application.applicant}</Typography> 

//                   <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>{profile.applicant.email}</Typography> 

//                   <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>Name:</Typography> 

//                   <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>{profile.applicant.name}</Typography> 

//                   <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>Phone Number:</Typography> 

//                   <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>{profile.applicant.phone_number}</Typography> 

//                   <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>Highest Qualification:</Typography> 

//                   <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>{profile.highest_qualification}</Typography> 

//                   <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>Stream:</Typography> 

//                   <Typography variant="body1" className="text-gray-500" style={{ zIndex: 1 }}>{profile.stream}</Typography> 

//                   <Typography variant="subtitle1" className="font-bold" style={{ zIndex: 1 }}>Skills:</Typography> 

//                   <div className="flex flex-wrap gap-1" style={{ zIndex: 1 }}> 

//                     {profile.skills.map((skill, index) => ( 

//                       <span key={index} className="bg-gray-200 px-2 py-1 rounded">{skill.name}</span> 

//                     ))} 

//                   </div> 

//                   <div className="mt-3" style={{ zIndex: 1 }}> 

//                     <IconButton 

//                       aria-label="expand-details" 

//                       onClick={() => handleExpandDetails(application.id)} 

//                       style={{ marginBottom: expandedApplicantId === application.id ? '10px' : 0 }} 

//                     > 

//                       <ExpandMoreIcon /> 

//                     </IconButton> 

//                   </div> 

//                   {expandedApplicantId === application.id && ( 

//                     <div className="mt-3" style={{ position: 'relative', zIndex: 2 }}> 

//                       <Typography variant="subtitle1" className="font-bold">Year:</Typography> 

//                       <Typography variant="body1" className="text-gray-500">{profile.year}</Typography> 

//                       <Typography variant="subtitle1" className="font-bold">Education Status:</Typography> 

//                       <Typography variant="body1" className="text-gray-500">{profile.education_status}</Typography> 

//                       <Typography variant="subtitle1" className="font-bold">Passing Year:</Typography> 

//                       <Typography variant="body1" className="text-gray-500">{profile.passing_year}</Typography> 

//                       <Typography variant="subtitle1" className="font-bold">CGPA:</Typography> 

//                       <Typography variant="body1" className="text-gray-500">{profile.cgpa}</Typography> 

//                       <Typography variant="subtitle1" className="font-bold">Address:</Typography> 

//                       <Typography variant="body1" className="text-gray-500">{profile.address}</Typography> 

//                       <Typography variant="subtitle1" className="font-bold">City:</Typography> 

//                       <Typography variant="body1" className="text-gray-500">{profile.city}</Typography> 

//                       <Typography variant="subtitle1" className="font-bold">State:</Typography> 

//                       <Typography variant="body1" className="text-gray-500">{profile.state}</Typography> 

//                       <Typography variant="subtitle1" className="font-bold">Pincode:</Typography> 

//                       <Typography variant="body1" className="text-gray-500">{profile.pincode}</Typography> 

//                     </div> 

//                   )} 

//                 </CardContent> 

//               </Card> 

//             ); 

//           })} 

//         </div> 

//       </div> 

//     </Modal> 

 

 

//     </div> 

//   ); 
// }; 
// export default ApplicationList; 


// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import {
//   TextField,
//   Button,
//   Card,
//   CardContent,
//   CardActions,
//   IconButton,
//   Modal,
//   Typography,
// } from '@mui/material';
// import { ArrowBack, ExpandMore } from '@mui/icons-material';
// import ExpandMoreIcon from '@mui/icons-material/ArrowForward';

// const ApplicationList = ({ applicantId, applicantProfileId }) => {
//   const [jobs, setJobs] = useState([]);
//   const [search, setSearch] = useState('');
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedJobId, setSelectedJobId] = useState(null);
//   const [expandedJobId, setExpandedJobId] = useState(null);
//   const [applicants, setApplicants] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [jobsPerPage] = useState(10);
//   const [applicantProfiles, setApplicantProfiles] = useState({});
//   const [expandedApplicantId, setExpandedApplicantId] = useState(null);

//   useEffect(() => {
//     fetchJobs();
//   }, [currentPage]);

//   const fetchJobs = async () => {
//     try {
//       const userId = localStorage.getItem('userid');
//       const orgResponse = await axios.get(`http://localhost:8000/api/v1/org/create/?created_by=${userId}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//         },
//       });

//       const organizations = orgResponse.data.results;
//       if (!organizations || organizations.length === 0) {
//         console.error('No organization found for user or empty response:', orgResponse);
//         return;
//       }

//       const organizationId = organizations[0].id;
//       const jobsResponse = await axios.get(`http://localhost:8000/api/v1/job/?company=${organizationId}&page=${currentPage}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//         },
//       });

//       const jobsData = jobsResponse.data.results;
//       setJobs(jobsData);
//     } catch (error) {
//       console.error('Error fetching jobs:', error);
//     }
//   };

//   const fetchApplicants = async (jobId) => {
//     try {
//       const applicationsResponse = await axios.get(`http://localhost:8000/api/v1/application/?job=${jobId}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//         },
//       });

//       console.log('Applications Response:', applicationsResponse);

//       if (applicationsResponse.data && applicationsResponse.data.data && Array.isArray(applicationsResponse.data.data)) {
//         setApplicants(applicationsResponse.data.data);

//         const profiles = {};
//         for (const application of applicationsResponse.data.data) {
//           const profileResponse = await axios.get(`http://localhost:8000/api/v1/applicantprofile/?applicant=${application.applicant}`, {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//             },
//           });

//           if (profileResponse.data && profileResponse.data.data) {
//             profiles[application.applicant] = profileResponse.data.data;
//             console.log(`Profile Response for applicant ${application.applicant}:`, profileResponse);
//           } else {
//             console.warn(`Profile not found for applicant ${application.applicant}`);
//           }
//         }
//         setApplicantProfiles(profiles);
//       } else {
//         console.error('Invalid or unexpected applications response structure:', applicationsResponse);
//         setApplicants([]);
//       }
//     } catch (error) {
//       console.error('Error fetching applicants:', error);
//       setApplicants([]);
//     }
//   };

//   const handleSearchChange = (event) => {
//     setSearch(event.target.value);
//   };

//   const handleExpandClick = (jobId) => {
//     setExpandedJobId(expandedJobId === jobId ? null : jobId);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setSelectedJobId(null);
//     setApplicants([]);
//     setApplicantProfiles({});
//   };

//   const handleShowApplications = (jobId) => {
//     setSelectedJobId(jobId);
//     fetchApplicants(jobId);
//     setIsModalOpen(true);
//   };

//   const handleShortlistApplicant = async (applicationId, currentStage) => {
//     try {
//       await axios.patch(`http://localhost:8000/api/v1/application/${applicationId}/`, {
//         stage: currentStage + 1,
//         status: 'Shortlisted',
//       }, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//         },
//       });
//       fetchApplicants(selectedJobId);
//     } catch (error) {
//       console.error('Error shortlisting applicant:', error);
//     }
//   };

//   const filteredJobs = jobs.filter(job =>
//     job.title.toLowerCase().includes(search.toLowerCase())
//   );

//   const indexOfLastJob = currentPage * jobsPerPage;
//   const indexOfFirstJob = indexOfLastJob - jobsPerPage;
//   const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

//   const paginate = pageNumber => setCurrentPage(pageNumber);

//   const handleExpandDetails = (applicationId) => {
//     setExpandedApplicantId(expandedApplicantId === applicationId ? null : applicationId);
//   };

//   return (
//     <div style={{ padding: '20px', background: '#ffffff', borderRadius: '20px' }}>
//       <TextField
//         label="Search by Role"
//         variant="outlined"
//         fullWidth
//         value={search}
//         onChange={handleSearchChange}
//         style={{ marginBottom: '20px' }}
//       />

//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
//         {currentJobs.map(job => (
//           <Card key={job.id} style={{ marginBottom: '20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
//             <CardContent style={{ flexGrow: 1 }}>
//               <div className="bg-blue-800 text-white text-center py-4" style={{ borderRadius: '15px' }}>
//                 <h2 className="text-2xl font-semibold">{job.title}</h2>
//               </div>
//               <div className="px-4 py-3 grid grid-cols-2 gap-x-4 overflow-y-auto max-h-96">
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Location:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.location}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Work Location:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.work_location}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Job Type:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.job_type}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Stipend/Salary:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.stipend_salary}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Deadline:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.deadline}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Openings:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.openings}</span>
//                 </div>
//                 <div className="mb-4">
//                   <span className="block text-gray-700 font-bold">Status:</span>
//                   <span className="block text-gray-900 overflow-hidden">{job.status}</span>
//                 </div>
//               </div>
//               {expandedJobId === job.id && (
//                 <div className="px-4 py-3">
//                   <div className="mb-4">
//                     <span className="block text-gray-700 font-bold">Description:</span>
//                     <span className="block text-gray-900 overflow-hidden">{job.description}</span>
//                   </div>
//                   <div className="mb-4">
//                     <span className="block text-gray-700 font-bold">Eligibility Criteria:</span>
//                     <span className="block text-gray-900 overflow-hidden">{job.eligibility_criteria}</span>
//                   </div>
//                   <div className="mb-4">
//                     <span className="block text-gray-700 font-bold">Perks & Benefits:</span>
//                     <span className="block text-gray-900 overflow-hidden">{job.perks_benefits}</span>
//                   </div>
//                 </div>
//               )}
//             </CardContent>
//             <CardActions>
//               <Button onClick={() => handleShowApplications(job.id)} variant="contained" color="primary" fullWidth style={{ borderRadius: '20px', backgroundColor: '#3f51b5' }}>Show Applications</Button>
//               <IconButton onClick={() => handleExpandClick(job.id)}>
//                 <ExpandMoreIcon />
//               </IconButton>
//             </CardActions>
//           </Card>
//         ))}
//       </div>

//       <Modal open={isModalOpen} onClose={handleCloseModal}>
//         <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', backgroundColor: '#fff', borderRadius: '10px', marginTop: '50px' }}>
//           <Typography variant="h6">Applicants for Job ID: {selectedJobId}</Typography>
//           {applicants.map(application => (
//             <Card key={application.id} style={{ margin: '10px 0' }}>
//               <CardContent>
//                 <Typography variant="subtitle1">Applicant: {application.applicant_name}</Typography>
//                 <Typography variant="body2">Status: {application.status}</Typography>
//                 <Typography variant="body2">Stage: {application.stage}</Typography>
//                 {application.answers_to_ques && Array.isArray(application.answers_to_ques) ? (
//                   <div>
//                     <Typography variant="subtitle1">Answers to Questions:</Typography>
//                     {application.answers_to_ques.map((qa, index) => (
//                       <div key={index} style={{ marginLeft: '10px' }}>
//                         <Typography variant="body1"><strong>Q: {qa.question}</strong></Typography>
//                         <Typography variant="body2">A: {qa.answer}</Typography>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <Typography>No answers available.</Typography>
//                 )}
//                 <Button onClick={() => handleShortlistApplicant(application.id, application.stage)}>Shortlist</Button>
//                 <IconButton onClick={() => handleExpandDetails(application.id)}>
//                   <ExpandMore />
//                 </IconButton>
//                 {expandedApplicantId === application.id && (
//                   <div>
//                     {/* Additional applicant details can go here */}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           ))}
//           <Button onClick={handleCloseModal}>Close</Button>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default ApplicationList;
