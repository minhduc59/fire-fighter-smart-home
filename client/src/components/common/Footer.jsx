import React from 'react';
import { MDBFooter, MDBContainer, MDBRow, MDBCol, MDBIcon } from 'mdb-react-ui-kit';

export default function Footer() {
  return (
    <MDBFooter bgColor='light' className='text-center text-muted py-4'>
      <MDBContainer>
        <MDBRow className='align-items-center'>
          <MDBCol md="6" className='mb-3 mb-md-0 text-md-start'>
            <h6 className='text-uppercase fw-bold mb-2'>
              <MDBIcon icon="fire-extinguisher" className="me-2" />
              FireGuard
            </h6>
            <p className='mb-0'>
              Advanced fire monitoring and suppression system for smart homes.
            </p>
          </MDBCol>
          <MDBCol md="6" className='text-md-end'>
            <small>© 2025 FireGuard. All rights reserved.</small>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </MDBFooter>
  );
}
