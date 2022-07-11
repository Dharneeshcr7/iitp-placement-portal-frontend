import Layout from '@/components/admin/Layout'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'
import { useCallback, useRef, useState } from 'react'
import { parseCookies } from '@/helpers/index'
import axios from 'axios'
import { API_URL } from '@/config/index'
import Link from 'next/link'

export default function Students({ data }) {
  const gridRef = useRef()
  const onBtExport = useCallback(() => {
    // See comment in pages/admin/students/index.js for logic behind this

    const selected_and_visible_node = gridRef.current.api.getSelectedNodes().findIndex(node => node.displayed);
  
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
  const [rowData] = useState(data.data)

  const [columnDefs] = useState([
    {
      headerName: 'S.No.',
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      checkboxSelection: true,
      valueGetter: 'node.rowIndex + 1',
    },
    {
      headerName: 'Company',
      field: 'attributes.company_name',
      cellRenderer: function (params) {
        return (
          <div>
            <Link href={`/admin/companies/${params.data.id}`}>
              {params.value}
            </Link>
          </div>
        )
      },
    },
    {
      headerName: 'Approval Status',
      field: 'attributes.status',
    },
    {
      headerName: 'Company Addrees',
      field: 'attributes.company_address',
    },
    {
      headerName: 'Contact 1 Name',
      field: 'attributes.contact1.name',
    },
    {
      headerName: 'Contact 1 Mobile No',
      field: 'attributes.contact1.mobile_no',
    },
  ])
  return (
    <Layout>
      <div className='flex-1'>
        <div className='border-b border-gray-200 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8'>
          <div className='flex-1 min-w-0'>
            <h1 className='text-lg font-medium leading-6 text-gray-900 sm:truncate'>
              Companies
            </h1>
          </div>
          <div className='mt-4 flex sm:mt-0 sm:ml-4'>
            <button
              type='button'
              className='order-1 ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:order-0 sm:ml-0'
            >
              Deactivate
            </button>
            <button
              type='button'
              onClick={onBtExport}
              className='order-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:order-1 sm:ml-3'
            >
              Export
            </button>

            <Link href={`/admin/companies/add`}>
              <button
                type='button'
                className='order-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:order-1 sm:ml-3'
              >
                Add Company
              </button>
            </Link>
          </div>
        </div>
        <div className='ag-theme-alpine mt-4' style={{ height: 600 }}>
          <AgGridReact
            ref={gridRef}
            rowMultiSelectWithClick={true}
            rowData={rowData}
            columnDefs={columnDefs}
            rowSelection='multiple'
            defaultColDef={{ sortable: true, filter: true }}
          ></AgGridReact>
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ req }) {
  const { token } = parseCookies(req)

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  }

  const res = await axios.get(`${API_URL}/api/companies?populate=*`, config)

  return {
    props: { data: res.data, statusCode: res.status, token: token }, // will be passed to the page component as props
  }
}

// ex: shiftwidth=2 expandtab:
