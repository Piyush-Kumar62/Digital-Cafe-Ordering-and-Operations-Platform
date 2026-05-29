import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { PostalPincodeService } from "./postal-pincode.service";

describe("PostalPincodeService", () => {
  let service: PostalPincodeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PostalPincodeService],
    });
    service = TestBed.inject(PostalPincodeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should return success with unique cities and states", () => {
    service.lookupPincode("400001").subscribe((result) => {
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.data.cities).toEqual(["Mumbai", "Navi Mumbai"]);
        expect(result.data.states).toEqual(["Maharashtra"]);
      }
    });

    const req = httpMock.expectOne(
      "http://localhost:8080/api/postal/pincode/400001",
    );
    req.flush({
      status: "success",
      data: {
        cities: ["Mumbai", "Navi Mumbai"],
        states: ["Maharashtra"],
      },
    });
  });

  it("should return not_found when API has no data", () => {
    service.lookupPincode("000000").subscribe((result) => {
      expect(result.status).toBe("not_found");
    });

    const req = httpMock.expectOne(
      "http://localhost:8080/api/postal/pincode/000000",
    );
    req.flush({
      status: "not_found",
    });
  });

  it("should return error on HTTP failure", () => {
    service.lookupPincode("500000").subscribe((result) => {
      expect(result.status).toBe("error");
    });

    const req = httpMock.expectOne(
      "http://localhost:8080/api/postal/pincode/500000",
    );
    req.flush("Server error", {
      status: 500,
      statusText: "Server Error",
    });
  });
});
