import React, { useCallback, useEffect, useState } from 'react'
import RegisteredGraph from '@/components/admin/home/RegisteredGraph'
import NewRequest from './NewRequest'
import { API_URL } from '@/config/index'
import axios from 'axios'
import PlacedGraph from './PlacedGraph'

export default function Home({ token = '' }) {
  const [student, setStudent] = useState([])
  const [job, setJob] = useState([])
  const [company, setCompany] = useState([])

  useEffect(() => {
    axios
      .get(`${API_URL}/api/students?populate=*`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(async (res) => {
        let fetched_data = res.data.data
        fetched_data = await getPlacedStatus(fetched_data)
        setStudent(fetched_data)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  useEffect(() => {
    fetch(
      `${API_URL}/api/jobs?filters[approval_status][$eq]=pending&populate=*`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())
      .then((res) => {
        setJob(res)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/api/companies?filters[status][$eq]=pending&populate=*`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        setCompany(res)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [token])

  // Get placed status of students from /api/student/placed-status
  // @Ouput: {placed: {placed_a1: [], placed_a2: [], placed_x: []}}
  const getPlacedStatus = useCallback(async (data) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    }
    const res = await axios.get(`${API_URL}/api/student/placed-status`, config)
    const placed = res.data.placed
    const placed_a1 = placed.placed_a1
    const placed_a2 = placed.placed_a2
    const placed_x = placed.placed_x

    // Update placed status of students
    const new_row_data = data.map((student) => {
      if (placed_a1.includes(student.attributes.roll)) {
        student.attributes.placed = 'A1'
      } else if (placed_a2.includes(student.attributes.roll)) {
        student.attributes.placed = 'A2'
      } else if (placed_x.includes(student.attributes.roll)) {
        student.attributes.placed = 'X'
      } else {
        student.attributes.placed = 'Not Placed'
      }
      return student
    })

    return new_row_data
  }, [])

  return (
    <div className='mt-4'>
      <ul
        role='list'
        className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
      >
        <li className='col-span-1 flex flex-col text-center bg-white rounded-lg shadow divide-y divide-gray-200 p-4'>
          <RegisteredGraph student={student} />
        </li>
        <li className='col-span-1 flex flex-col text-center bg-white rounded-lg shadow divide-y divide-gray-200 p-4'>
          <NewRequest student={student} job={job} company={company} />
        </li>
        <li className='col-span-1 flex flex-col text-center bg-white rounded-lg shadow divide-y divide-gray-200 p-4'></li>
      </ul>
      <div className='mt-4'>
        <PlacedGraph student={student} />
      </div>
    </div>
  )
}
