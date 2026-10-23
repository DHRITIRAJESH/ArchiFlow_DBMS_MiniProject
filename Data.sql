USE `PES1UG24CS907-Lab7`;

INSERT INTO HOSTEL VALUES
('H01','Ganga','North Campus, Block A',24),
('H02','Yamuna','North Campus, Block B',18),
('H03','Kaveri','South Campus, Block A',20),
('H04','Narmada','South Campus, Block B',12);

INSERT INTO ROOM VALUES
('H01','101',1),('H01','102',1),('H01','103',1),('H01','201',2),('H01','202',2),
('H02','101',1),('H02','102',1),('H02','201',2),
('H03','101',1),('H03','102',1),('H03','201',2),('H03','202',2),
('H04','101',1),('H04','102',1);

INSERT INTO BED VALUES
('H01','101','B1','N'),('H01','101','B2','N'),('H01','101','B3','Y'),
('H01','102','B1','N'),('H01','102','B2','Y'),
('H01','103','B1','N'),('H01','103','B2','Y'),
('H01','201','B1','Y'),('H01','201','B2','Y'),('H01','201','B3','Y'),
('H01','202','B1','Y'),('H01','202','B2','Y'),
('H02','101','B1','N'),('H02','101','B2','N'),
('H02','102','B1','N'),('H02','102','B2','Y'),
('H02','201','B1','N'),('H02','201','B2','Y'),
('H03','101','B1','N'),('H03','101','B2','N'),
('H03','102','B1','N'),('H03','102','B2','Y'),
('H03','201','B1','Y'),('H03','201','B2','Y'),
('H03','202','B1','Y'),('H03','202','B2','Y'),
('H04','101','B1','N'),('H04','101','B2','N'),
('H04','102','B1','N'),('H04','102','B2','N');

INSERT INTO STAFF VALUES
('ST01','Ramesh Gupta',72000.00,'Warden','H01',NULL),
('ST02','Lakshmi Menon',70000.00,'Warden','H03',NULL),
('ST03','Suresh Patil',38000.00,'Caretaker','H01','ST01'),
('ST04','Mohan Das',32000.00,'Cook','H01','ST01'),
('ST05','Imran Khan',29000.00,'Security','H02','ST01'),
('ST06','Kavita Joshi',36000.00,'Caretaker','H03','ST02'),
('ST07','Geeta Kulkarni',31000.00,'Cook','H03','ST02'),
('ST08','Anil Yadav',28000.00,'Security','H04','ST02');

INSERT INTO STUDENT VALUES
('PES23CS001','Aarav','Kumar','Sharma','M','2004-03-15','aarav.sharma@pes.edu'),
('PES23CS002','Diya',NULL,'Nair','F','2005-07-22','diya.nair@pes.edu'),
('PES23CS003','Rohan','Raj','Verma','M','2004-11-05','rohan.verma@pes.edu'),
('PES23CS004','Ananya',NULL,'Iyer','F','2005-01-30','ananya.iyer@pes.edu'),
('PES23CS005','Karthik',NULL,'Rao','M','2003-09-12','karthik.rao@pes.edu'),
('PES23CS006','Meera','S','Pillai','F','2005-04-18','meera.pillai@pes.edu'),
('PES23CS007','Aditya',NULL,'Menon','M','2004-06-25','aditya.menon@pes.edu'),
('PES23CS008','Sneha',NULL,'Reddy','F','2005-12-02','sneha.reddy@pes.edu'),
('PES23CS009','Vikram',NULL,'Singh','M','2003-02-14','vikram.singh@pes.edu'),
('PES23CS010','Ishita',NULL,'Bose','F','2006-08-09','ishita.bose@pes.edu'),
('PES23CS011','Nikhil',NULL,'Joshi','M','2004-10-21','nikhil.joshi@pes.edu'),
('PES23CS012','Priya',NULL,'Desai','F','2005-05-16','priya.desai@pes.edu'),
('PES23CS013','Arjun',NULL,'Gowda','M','2004-01-08','arjun.gowda@pes.edu'),
('PES23CS014','Tanvi',NULL,'Shetty','F','2005-09-27','tanvi.shetty@pes.edu'),
('PES23CS015','Rahul',NULL,'Mehta','M','2003-12-19','rahul.mehta@pes.edu');

INSERT INTO STUDENT_PHONE VALUES
('PES23CS001','9845012301'),('PES23CS001','8012345601'),
('PES23CS002','9845012302'),
('PES23CS003','9845012303'),('PES23CS003','8012345603'),
('PES23CS004','9845012304'),
('PES23CS005','9845012305'),
('PES23CS008','9845012308'),
('PES23CS010','9845012310'),
('PES23CS012','9845012312'),('PES23CS012','8012345612'),
('PES23CS015','9845012315');

INSERT INTO FACILITY VALUES
('F01','Mess','06:30-22:00','H01'),
('F02','Gymnasium','05:00-09:00, 17:00-21:00','H01'),
('F03','Laundry','08:00-20:00','H02'),
('F04','Reading Room','24x7','H03'),
('F05','Mess','06:30-22:00','H03'),
('F06','Wi-Fi Zone','24x7','H04');

INSERT INTO USES VALUES
('PES23CS001','F01'),('PES23CS001','F02'),
('PES23CS003','F01'),('PES23CS003','F02'),
('PES23CS005','F01'),
('PES23CS007','F01'),
('PES23CS009','F03'),
('PES23CS011','F03'),
('PES23CS013','F03'),
('PES23CS002','F04'),('PES23CS002','F05'),
('PES23CS004','F05'),
('PES23CS006','F04'),
('PES23CS008','F06'),
('PES23CS010','F06'),
('PES23CS012','F06'),
('PES23CS014','F06');

INSERT INTO ALLOCATE VALUES
('H01','101','PES23CS001','2026-07-01','2026-07-02',NULL),
('H01','101','PES23CS003','2026-07-01','2026-07-03',NULL),
('H01','102','PES23CS005','2026-07-02','2026-07-04',NULL),
('H01','103','PES23CS007','2026-07-02','2026-07-04',NULL),
('H02','101','PES23CS009','2026-07-03','2026-07-05',NULL),
('H02','101','PES23CS011','2026-07-03','2026-07-05',NULL),
('H02','102','PES23CS013','2026-07-04','2026-07-06',NULL),
('H02','201','PES23CS015','2026-07-04','2026-07-06',NULL),
('H03','101','PES23CS002','2026-07-01','2026-07-02',NULL),
('H03','101','PES23CS004','2026-07-01','2026-07-02',NULL),
('H03','102','PES23CS006','2026-07-02','2026-07-03',NULL),
('H04','101','PES23CS008','2026-07-03','2026-07-04',NULL),
('H04','101','PES23CS010','2026-07-03','2026-07-04',NULL),
('H04','102','PES23CS012','2026-07-05','2026-07-06',NULL),
('H04','102','PES23CS014','2026-07-05','2026-07-06',NULL);

INSERT INTO PAYMENT VALUES
('PAY001',45000.00,'ONLINE','2026-07-01','PES23CS001'),
('PAY002',15000.00,'CASH','2026-08-10','PES23CS001'),
('PAY003',50000.00,'ONLINE','2026-07-01','PES23CS002'),
('PAY004',45000.00,'DD','2026-07-02','PES23CS003'),
('PAY005',30000.00,'ONLINE','2026-07-02','PES23CS004'),
('PAY006',20000.00,'ONLINE','2026-08-12','PES23CS004'),
('PAY007',45000.00,'ONLINE','2026-07-03','PES23CS005'),
('PAY008',50000.00,'DD','2026-07-03','PES23CS006'),
('PAY009',50000.00,'ONLINE','2026-07-04','PES23CS008'),
('PAY010',25000.00,'CASH','2026-07-05','PES23CS009'),
('PAY011',20000.00,'ONLINE','2026-08-15','PES23CS009'),
('PAY012',48000.00,'ONLINE','2026-07-06','PES23CS010'),
('PAY013',52000.00,'ONLINE','2026-07-07','PES23CS012'),
('PAY014',45000.00,'DD','2026-07-08','PES23CS013'),
('PAY015',26000.00,'ONLINE','2026-07-09','PES23CS014'),
('PAY016',26000.00,'ONLINE','2026-08-20','PES23CS014');

INSERT INTO RECEIPT VALUES
('RCP001','2026-07-01','PAY001'),('RCP002','2026-08-10','PAY002'),
('RCP003','2026-07-01','PAY003'),('RCP004','2026-07-02','PAY004'),
('RCP005','2026-07-02','PAY005'),('RCP006','2026-08-12','PAY006'),
('RCP007','2026-07-03','PAY007'),('RCP008','2026-07-03','PAY008'),
('RCP009','2026-07-04','PAY009'),('RCP010','2026-07-05','PAY010'),
('RCP011','2026-08-15','PAY011'),('RCP012','2026-07-06','PAY012'),
('RCP013','2026-07-07','PAY013'),('RCP014','2026-07-08','PAY014'),
('RCP015','2026-07-09','PAY015'),('RCP016','2026-08-20','PAY016');

-- Newly admitted student, not yet allocated a bed (used by sp_allocate_bed)
INSERT INTO STUDENT VALUES
('PES23CS016','Sanjay',NULL,'Nanda','M','2004-08-30','sanjay.nanda@pes.edu');
INSERT INTO STUDENT_PHONE VALUES ('PES23CS016','9845012316');

-- Lab 07 addendum : newly admitted students, not yet allocated and with no payment
-- (used by the triggers of Task 1; PES23CS017 and PES23CS019 are female, PES23CS018 and PES23CS020 male)
INSERT INTO STUDENT VALUES
('PES23CS017','Kavya',NULL,'Hegde','F','2005-03-11','kavya.hegde@pes.edu'),
('PES23CS018','Siddharth',NULL,'Kamath','M','2004-12-04','siddharth.kamath@pes.edu'),
('PES23CS019','Riya',NULL,'Kulkarni','F','2005-06-19','riya.kulkarni@pes.edu'),
('PES23CS020','Varun',NULL,'Bhat','M','2004-02-27','varun.bhat@pes.edu');
INSERT INTO STUDENT_PHONE VALUES
('PES23CS017','9845012317'),('PES23CS018','9845012318'),
('PES23CS019','9845012319'),('PES23CS020','9845012320');
