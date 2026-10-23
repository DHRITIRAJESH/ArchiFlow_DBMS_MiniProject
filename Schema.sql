CREATE DATABASE IF NOT EXISTS `PES1UG24CS907-Lab7`;
USE `PES1UG24CS907-Lab7`;

-- Part 1 : tables with primary keys and column-level constraints
CREATE TABLE HOSTEL (
    Hostel_ID    VARCHAR(10)  NOT NULL,
    Hostel_Name  VARCHAR(50)  NOT NULL,
    Location     VARCHAR(100) NOT NULL,
    Capacity     INT          NOT NULL DEFAULT 0,
    CONSTRAINT pk_hostel PRIMARY KEY (Hostel_ID),
    CONSTRAINT chk_hostel_capacity CHECK (Capacity >= 0)
);

CREATE TABLE STAFF (
    Staff_ID      VARCHAR(10)   NOT NULL,
    Name          VARCHAR(60)   NOT NULL,
    Salary        DECIMAL(10,2) NOT NULL,
    Job           VARCHAR(40)   NOT NULL DEFAULT 'Support Staff',
    Hostel_ID     VARCHAR(10)   NOT NULL,
    Supervisor_ID VARCHAR(10)   NULL,
    CONSTRAINT pk_staff PRIMARY KEY (Staff_ID),
    CONSTRAINT chk_staff_salary CHECK (Salary > 0)
);

CREATE TABLE ROOM (
    Hostel_ID   VARCHAR(10) NOT NULL,
    Room_Number VARCHAR(10) NOT NULL,
    Floor       INT         NOT NULL DEFAULT 0,
    CONSTRAINT pk_room PRIMARY KEY (Hostel_ID, Room_Number)
);

CREATE TABLE BED (
    Hostel_ID    VARCHAR(10) NOT NULL,
    Room_Number  VARCHAR(10) NOT NULL,
    Bed_Number   VARCHAR(5)  NOT NULL,
    Availability CHAR(1)     NOT NULL DEFAULT 'Y',
    CONSTRAINT pk_bed PRIMARY KEY (Hostel_ID, Room_Number, Bed_Number),
    CONSTRAINT chk_bed_availability CHECK (Availability IN ('Y','N'))
);

CREATE TABLE STUDENT (
    Student_ID    VARCHAR(12) NOT NULL,
    First_Name    VARCHAR(30) NOT NULL,
    Middle_Name   VARCHAR(30) NULL,
    Last_Name     VARCHAR(30) NOT NULL,
    Gender        CHAR(1)     NOT NULL,
    Date_of_Birth DATE        NOT NULL,
    Email_Address VARCHAR(60) NOT NULL,
    CONSTRAINT pk_student PRIMARY KEY (Student_ID),
    CONSTRAINT uq_student_email UNIQUE (Email_Address)
);

CREATE TABLE STUDENT_PHONE (
    Student_ID   VARCHAR(12) NOT NULL,
    Phone_Number VARCHAR(15) NOT NULL,
    CONSTRAINT pk_student_phone PRIMARY KEY (Student_ID, Phone_Number)
);

CREATE TABLE FACILITY (
    Facility_ID     VARCHAR(10) NOT NULL,
    Facility_Name   VARCHAR(50) NOT NULL,
    Operating_Hours VARCHAR(40) NOT NULL DEFAULT '24x7',
    Hostel_ID       VARCHAR(10) NOT NULL,
    CONSTRAINT pk_facility PRIMARY KEY (Facility_ID)
);

CREATE TABLE USES (
    Student_ID  VARCHAR(12) NOT NULL,
    Facility_ID VARCHAR(10) NOT NULL,
    CONSTRAINT pk_uses PRIMARY KEY (Student_ID, Facility_ID)
);

CREATE TABLE ALLOCATE (
    Hostel_ID       VARCHAR(10) NOT NULL,
    Room_Number     VARCHAR(10) NOT NULL,
    Student_ID      VARCHAR(12) NOT NULL,
    Allocation_Date DATE        NOT NULL,
    Check_in_Date   DATE        NULL,
    Check_out_Date  DATE        NULL,
    CONSTRAINT pk_allocate PRIMARY KEY (Hostel_ID, Room_Number, Student_ID),
    CONSTRAINT chk_allocate_dates
        CHECK (Check_out_Date IS NULL OR Check_out_Date >= Check_in_Date)
);

CREATE TABLE PAYMENT (
    Payment_ID   VARCHAR(12)   NOT NULL,
    Amount       DECIMAL(10,2) NOT NULL,
    Payment_Type VARCHAR(20)   NOT NULL DEFAULT 'ONLINE',
    Payment_Date DATE          NOT NULL,
    Student_ID   VARCHAR(12)   NOT NULL,
    CONSTRAINT pk_payment PRIMARY KEY (Payment_ID),
    CONSTRAINT chk_payment_amount CHECK (Amount > 0)
);

CREATE TABLE RECEIPT (
    Receipt_ID   VARCHAR(12) NOT NULL,
    Receipt_Date DATE        NOT NULL,
    Payment_ID   VARCHAR(12) NOT NULL,
    CONSTRAINT pk_receipt PRIMARY KEY (Receipt_ID),
    CONSTRAINT uq_receipt_payment UNIQUE (Payment_ID)
);

-- Part 2 : one foreign key, one referential action, per statement
ALTER TABLE STAFF ADD CONSTRAINT fk_staff_hostel FOREIGN KEY (Hostel_ID)
    REFERENCES HOSTEL (Hostel_ID) ON UPDATE CASCADE;
ALTER TABLE STAFF ADD CONSTRAINT fk_staff_supervisor FOREIGN KEY (Supervisor_ID)
    REFERENCES STAFF (Staff_ID) ON DELETE SET NULL;
ALTER TABLE ROOM ADD CONSTRAINT fk_room_hostel FOREIGN KEY (Hostel_ID)
    REFERENCES HOSTEL (Hostel_ID) ON DELETE CASCADE;
ALTER TABLE BED ADD CONSTRAINT fk_bed_room FOREIGN KEY (Hostel_ID, Room_Number)
    REFERENCES ROOM (Hostel_ID, Room_Number) ON DELETE CASCADE;
ALTER TABLE STUDENT_PHONE ADD CONSTRAINT fk_phone_student FOREIGN KEY (Student_ID)
    REFERENCES STUDENT (Student_ID) ON DELETE CASCADE;
ALTER TABLE FACILITY ADD CONSTRAINT fk_facility_hostel FOREIGN KEY (Hostel_ID)
    REFERENCES HOSTEL (Hostel_ID) ON DELETE CASCADE;
ALTER TABLE USES ADD CONSTRAINT fk_uses_student FOREIGN KEY (Student_ID)
    REFERENCES STUDENT (Student_ID) ON DELETE CASCADE;
ALTER TABLE USES ADD CONSTRAINT fk_uses_facility FOREIGN KEY (Facility_ID)
    REFERENCES FACILITY (Facility_ID) ON DELETE CASCADE;
ALTER TABLE ALLOCATE ADD CONSTRAINT fk_allocate_room FOREIGN KEY (Hostel_ID, Room_Number)
    REFERENCES ROOM (Hostel_ID, Room_Number) ON DELETE CASCADE;
ALTER TABLE ALLOCATE ADD CONSTRAINT fk_allocate_student FOREIGN KEY (Student_ID)
    REFERENCES STUDENT (Student_ID) ON DELETE CASCADE;
ALTER TABLE PAYMENT ADD CONSTRAINT fk_payment_student FOREIGN KEY (Student_ID)
    REFERENCES STUDENT (Student_ID) ON DELETE CASCADE;
ALTER TABLE RECEIPT ADD CONSTRAINT fk_receipt_payment FOREIGN KEY (Payment_ID)
    REFERENCES PAYMENT (Payment_ID) ON DELETE CASCADE;
