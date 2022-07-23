import { useCallback, useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { toast } from 'react-toastify'
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'
import { API_URL } from '@/config/index'
import qs from 'qs'
import Link from 'next/link'

export default function StudentApplied({ token = '', id = '' }) {
  const [students, setStudents] = useState([])
  const gridRef = useRef()
  const onBtExport = useCallback(() => {
    // See comment in pages/admin/students/index.js for logic behind this

    const selected_and_visible_node = gridRef.current.api
      .getSelectedNodes()
      .findIndex((node) => node.displayed)

    if (selected_and_visible_node == -1) {
      // If nothing is selected, export ALL
      gridRef.current.api.exportDataAsCsv()
    } else {
      // Else, export selected
      gridRef.current.api.exportDataAsCsv({
        onlySelected: true,
      })
    }
  }, [])

  const handlePlaced = async () => {
    // Only use visible/filtered + selected rows
    const selectedRows = gridRef.current.api
      .getSelectedNodes()
      .filter((node) => node.displayed)
      .map((node) => node.data)
    const selectedStudents = selectedRows.map(
      (row) => row.attributes.student.data.attributes.name
    )
    if (
      confirm(
        `Are you sure you want to place these students? ${selectedStudents}`
      )
    ) {
      selectedRows.map((row) => {
        fetch(`${API_URL}/api/applications/${row.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              status: 'selected',
            },
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            toast.success(
              `${row.attributes.student.data.attributes.name} marked as placed`
            )
          })
          .catch((err) => {
            console.log(err)
            toast.error(
              `${row.attributes.student.data.attributes.name} failed to place`
            )
          })
      })
      fetchData()
    }
  }

  const handleUnplaced = async () => {
    // Only use visible/filtered + selected rows
    const selectedRows = gridRef.current.api
      .getSelectedNodes()
      .filter((node) => node.displayed)
      .map((node) => node.data)
    const selectedStudents = selectedRows.map(
      (row) => row.attributes.student.data.attributes.name
    )
    if (
      confirm(
        `Are you sure you want to unplace these students? ${selectedStudents}`
      )
    ) {
      selectedRows.map((row) => {
        fetch(`${API_URL}/api/applications/${row.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              status: 'applied',
            },
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            toast.success(
              `${row.attributes.student.data.attributes.name} marked as unplaced`
            )
          })
          .catch((err) => {
            console.log(err)
            toast.error(
              `${row.attributes.student.data.attributes.name} failed to unplace`
            )
          })
      })
      fetchData()
    }
  }

  const handleRejected = async () => {
    // Only use visible/filtered + selected rows
    const selectedRows = gridRef.current.api
      .getSelectedNodes()
      .filter((node) => node.displayed)
      .map((node) => node.data)
    const selectedStudents = selectedRows.map(
      (row) => row.attributes.student.data.attributes.name
    )
    if (
      confirm(
        `Are you sure you want to reject these students? ${selectedStudents}`
      )
    ) {
      selectedRows.map((row) => {
        fetch(`${API_URL}/api/applications/${row.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              status: 'rejected',
            },
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            toast.success(
              `${row.attributes.student.data.attributes.name} marked as rejected`
            )
          })
          .catch((err) => {
            console.log(err)
            toast.error(
              `${row.attributes.student.data.attributes.name} failed to reject`
            )
          })
      })
      fetchData()
    }
  }

  const getSelectedRowData = () => {
    /**
     * Note: getSelectedRows() also returns rows that are not visible (ie. filtered)
     *
     * Instead, using getSelectedNodes().map(node => node.data)
     *
     * node.data refers to exactly same object as returned by getSelectedRows
     * Can verify this by just comparing the objects, node.data and row in console
     */

    // visible selected rows
    const selectedRows = gridRef.current.api
      .getSelectedNodes()
      .filter((node) => node.displayed)
      .map((node) => node.data)
    const selectedData = selectedRows
      .map((node) => node.attributes.student.data.attributes.roll)
      .join()
    downloadCV(selectedData)
    return selectedData
  }

  const downloadCV = async (ids) => {
    if (!ids || ids.trim().length === 0) {
      toast.error('No row selected')
      return
    }

    // download zip file
    fetch(`${API_URL}/api/admin/resume-zip?rolls=${ids}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status >= 400) {
          const res_json = await res.json()
          console.error(res_json)
          toast.error(res_json.error.message)
          throw res_json.error
        }

        return res.blob()
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'resume.zip')
        document.body.appendChild(link)
        link.click()
      })
      .catch((err) => {
        console.log(err)
      })
  }

  const query = qs.stringify(
    {
      populate: ['student.course', 'job.company', 'student.program'],
      filters: {
        job: {
          id: {
            $eq: id,
          },
        },
      },
    },
    {
      encodeValuesOnly: true, // prettify url
    }
  )

  const fetchData = async () => {
    const res = await fetch(`${API_URL}/api/applications?${query}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await res.json()
    setStudents(data.data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const [columnDefs] = useState([
    {
      headerName: 'S.No.',
      valueGetter: 'node.rowIndex + 1',
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      checkboxSelection: true,
    },
    {
      headerName: 'Status',
      field: 'attributes.status',
    },
    {
      headerName: 'Student Name',
      field: 'attributes.student.data.attributes.name',
    },
    {
      headerName: 'Roll',
      field: 'attributes.student.data.attributes.roll',
      cellRenderer: function (params) {
        return (
          <div>
            <Link href={`/admin/students/${params.data.id}`}>
              <a>{params.value}</a>
            </Link>
          </div>
        )
      },
    },
    {
      headerName: 'Institute Email',
      field: 'attributes.student.data.attributes.institute_email_id',
    },
    {
      headerName: 'Personal Email',
      field: 'attributes.student.data.attributes.personal_email_id',
    },
    {
      headerName: 'Mobile Number',
      field: 'attributes.student.data.attributes.mobile_number_1',
    },
    {
      headerName: 'Alternate Mobile Number',
      field: 'attributes.student.data.attributes.mobile_number_2',
    },
    {
      headerName: 'Program',
      field:
        'attributes.student.data.attributes.program.data.attributes.program_name',
    },
    {
      headerName: 'Course',
      field:
        'attributes.student.data.attributes.course.data.attributes.course_name',
    },
    {
      headerName: 'Category',
      field: 'attributes.student.data.attributes.category'
    },
    {
      headerName: 'Gender',
      field: 'attributes.student.data.attributes.gender'
    },
    {
      headerName: 'Xth Marks',
      field: 'attributes.student.data.attributes.X_marks',
    },
    {
      headerName: 'XIIth Marks',
      field: 'attributes.student.data.attributes.XII_marks',
    },
    {
      headerName: 'CPI',
      field: 'attributes.student.data.attributes.cpi',
    },
    {
      headerName: 'Classification',
      field: 'attributes.job.data.attributes.classification',
    },
    {
      headerName: 'Resume Link',
      field: 'attributes.student.data.attributes.resume_link',
      cellRenderer: function (params) {
        return (
          <div>
            <a
              href={params.value}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-indigo-600 hover:text-indigo-700 focus:text-indigo-800'
            >
              View Resume
            </a>
          </div>
        )
      },
    },
  ])
  return (
    <div className='my-4'>
      <div className='border-b border-gray-200 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8'>
        <div className='flex-1 min-w-0'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>
            Students Applied
          </h3>
        </div>
        <div className='mt-4 sm:mt-0 sm:ml-4'>
          <button
            type='button'
            className='order-1 ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:order-0 sm:ml-0'
          >
            Deactivate
          </button>
          <button
            type='button'
            onClick={handleRejected}
            className='order-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:order-1 sm:ml-3'
          >
            Mark as Rejected
          </button>
          <button
            type='button'
            onClick={handleUnplaced}
            className='order-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:order-1 sm:ml-3'
          >
            UnMark as Placed
          </button>
          <button
            type='button'
            onClick={handlePlaced}
            className='order-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:order-1 sm:ml-3'
          >
            Mark as Placed
          </button>
          <button
            type='button'
            onClick={onBtExport}
            className='order-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:order-1 sm:ml-3'
          >
            Export
          </button>

          <button
            onClick={getSelectedRowData}
            type='button'
            className='order-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:order-1 sm:ml-3'
          >
            Download CV
          </button>
        </div>
      </div>

      <div className='ag-theme-alpine mt-4' style={{ height: 200 }}>
        <AgGridReact
          ref={gridRef}
          rowMultiSelectWithClick={true}
          rowSelection='multiple'
          rowData={students}
          columnDefs={columnDefs}
          defaultColDef={{ sortable: true, filter: true }}
        ></AgGridReact>
      </div>
    </div>
  )
}

// ex: shiftwidth=2 expandtab:
